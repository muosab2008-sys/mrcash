import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

// 1. تهيئة الفايربيز لحساب الـ Admin وتجنب مشاكل سيرفر Vercel
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.message);
  }
}

const db = admin.firestore();

// دالة لحساب تشفير SHA-256 المطلوبة من GemiAd
function calculateSHA256Hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// 2. مستخرج البيانات الذكي لـ GemiAd يدعم الـ GET والـ POST والـ Form-Data
async function parseGemiAdData(req: NextRequest) {
  const urlParams = new URL(req.url).searchParams;
  let bodyParams: any = {};

  try {
    const formData = await req.formData();
    formData.forEach((value, key) => {
      bodyParams[key] = value;
    });
  } catch (e) {
    try {
      bodyParams = await req.json();
    } catch (jsError) {
      bodyParams = {};
    }
  }

  // دعم قراءة المعاملات بكلتا الحالتين (حروف كبيرة أو صغيرة لضمان عدم السقوط)
  return {
    userId: bodyParams.userId || urlParams.get('userId'),
    offerId: bodyParams.offerId || urlParams.get('offerId'),
    offerName: bodyParams.offerName || urlParams.get('offerName'),
    eventId: bodyParams.eventId || urlParams.get('eventId'),
    eventName: bodyParams.eventName || urlParams.get('eventName'),
    payout: bodyParams.payout || urlParams.get('payout'),
    reward: bodyParams.reward || urlParams.get('reward'),
    txId: bodyParams.txId || urlParams.get('txId') || bodyParams.txid || urlParams.get('txid'),
    status: bodyParams.status || urlParams.get('status'),
    ip: bodyParams.ip || urlParams.get('ip'),
    sub1: bodyParams.sub1 || urlParams.get('sub1'),
    sub2: bodyParams.sub2 || urlParams.get('sub2'),
    hash: bodyParams.hash || urlParams.get('hash'),
  };
}

export async function POST(req: NextRequest) {
  try {
    // 3. حماية الـ IP (IP Whitelisting) المحددة من الشركة لزيادة الأمان
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';
    const ALLOWED_IP = "64.226.92.208"; // الـ IP الرسمي لـ GemiAd

    if (clientIp !== ALLOWED_IP && process.env.NODE_ENV === 'production') {
      console.warn(`Security Warning: Unauthorized IP attempts to access GemiAd postback: ${clientIp}`);
      return new NextResponse("Unauthorized IP", { status: 403 });
    }

    // استخراج وتجهيز البيانات المرسلة من الدالة الذكية
    const data = await parseGemiAdData(req);

    const rawUserId = data.userId;
    const offerId = data.offerId;
    const txId = data.txId;
    const reward = data.reward;
    const status = data.status; // completed أو rejected
    const hash = data.hash;

    // التحقق من وجود المعاملات الأساسية الإلزامية لتجنب كراش السيرفر
    if (!hash || !rawUserId || !offerId || !txId) {
      console.warn("GemiAd Postback: Missing required parameters", data);
      return new NextResponse("ERROR: Missing Parameters", { status: 400 });
    }

    const SECRET_KEY = process.env.GEMIAD_SECRET_KEY;
    if (!SECRET_KEY) {
      console.error("Missing GEMIAD_SECRET_KEY in Environment Variables");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    // 4. التحقق الأمني الفعلي من الـ Hash بناءً على توثيق GemiAd
    // Formula: SHA256(userId + offerId + txId + secretKey)
    const expectedHash = calculateSHA256Hash(`${rawUserId}${offerId}${txId}${SECRET_KEY}`);
    if (hash !== expectedHash) {
      console.warn(`Security Warning: Hash mismatch from GemiAd for txId: ${txId}`);
      return new NextResponse("ERROR: Signature doesn't match", { status: 400 });
    }

    // تنظيف الـ userId في حال أرسلت لوحة الشركة كلمة TEST_ قبل الـ UID
    let userId = rawUserId;
    if (userId.startsWith('TEST_')) {
      userId = userId.replace('TEST_', '');
    }

    // 5. معالجة وتطهير النقاط (الموجبة والسالبة للمرتجعات)
    let finalReward = parseFloat(String(reward).replace(/[^0-9.-]/g, ''));
    
    if (isNaN(finalReward)) {
      const payoutVal = parseFloat(String(data.payout).replace(/[^0-9.-]/g, '')) || 0;
      finalReward = payoutVal * 2000; // 2000 نقطة لكل دولار كاحتياط
    }

    // التعامل مع الـ Reversals (إذا تم إلغاء أو رفض العرض من لوحتهم)
    if (status === 'rejected') {
      finalReward = -Math.abs(finalReward);
    }

    // صياغة اسم العرض بدقة للـ Log والإشعار
    const offerName = data.offerName && data.offerName !== "undefined" && data.offerName !== "" 
      ? data.offerName 
      : "Premium Offer";

    const transactionRef = db.collection('transactions').doc(txId);
    
    // فلتر منع تكرار العمليات (Deduplication)
    if (!txId.startsWith('test_') && status !== 'rejected') {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return new NextResponse("Approved", { status: 200 }); // مضافة مسبقاً، نرد بالقبول فوراً
      }
    }

    const userRef = db.collection('users').doc(userId);
    const notificationRef = db.collection('notifications').doc();

    // 6. معاملة Firestore الموحدة (Transaction) لتحديث رصيد MrCash وهيكلة الإشعارات
    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // إنشاء مستخدم تست تلقائياً في بيئة الفحص لمنع تعطل زر الإرسال التجريبي
        ts.set(userRef, { points: finalReward, email: "test_user@mrcash.app", createdAt: new Date() });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      // أ) تسجيل سجل العملية في الـ history لقاعدة بياناتك
      ts.set(transactionRef, {
        userId: userId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: offerId,
        offerName: `${offerName} (GemiAd)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: status === 'rejected' ? 'reversed' : 'completed'
      });

      // ب) إرسال الإشعار باللغة الإنجليزية متضمناً اسم الشركة [ GemiAd ] بوضوح
      ts.set(notificationRef, {
        userId: userId,
        title: finalReward > 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: finalReward > 0 
          ? `Your account has been credited with +${finalReward} points for completing: [ ${offerName} ] from GemiAd.`
          : `Your account was deducted by ${Math.abs(finalReward)} points due to offer cancellation from GemiAd.`,
        type: finalReward > 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 7. الرد النصي المطلوب لـ GemiAd لتأكيد النجاح الفوري
    return new NextResponse("Approved", { status: 200 });

  } catch (error: any) {
    console.error("GemiAd Postback Critical Error:", error.message);
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}

// دعم الـ GET لتسهيل الفحص والتكامل عبر لوحة تحكم الشركاء
export async function GET(req: NextRequest) {
  return POST(req);
}
