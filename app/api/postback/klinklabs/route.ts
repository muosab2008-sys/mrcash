import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// 1. تهيئة الفايربيز لحساب الـ Admin داخلياً وتجنب تكرار التهيئة في Vercel
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

// 2. مستخرج البيانات المرن ليقرأ من الـ URL Parameters (الـ GET) أو الـ JSON (في حال الـ POST)
async function parsePostbackData(req: NextRequest) {
  const urlParams = new URL(req.url).searchParams;
  let bodyParams: any = {};

  try {
    if (req.method === "POST") {
      bodyParams = await req.json();
    }
  } catch (e) {
    bodyParams = {};
  }

  return {
    userId: urlParams.get('userId') || bodyParams.userId || urlParams.get('user_id') || bodyParams.user_id,
    payout: urlParams.get('payout') || bodyParams.payout,
    status: urlParams.get('status') || bodyParams.status,
    eventType: urlParams.get('eventType') || bodyParams.eventType,
    conversionId: urlParams.get('conversionId') || bodyParams.conversionId || urlParams.get('conversion_id') || bodyParams.conversion_id,
    offerName: urlParams.get('offerName') || bodyParams.offerName || urlParams.get('offer_name') || bodyParams.offer_name,
    offerId: urlParams.get('offerId') || bodyParams.offerId || urlParams.get('offer_id') || bodyParams.offer_id,
  };
}

export async function POST(req: NextRequest) {
  try {
    // 3. حماية الـ IP Whitelisting المذكورة في التوثيق ولوحة التحكم
    const forwardHeader = req.headers.get('x-forwarded-for');
    const clientIp = forwardHeader ? forwardHeader.split(',')[0].trim() : '';
    const ALLOWED_IPS = ["34.118.33.53", "138.68.125.171", "64.226.93.56"];

    if (clientIp && !ALLOWED_IPS.includes(clientIp) && !clientIp.startsWith('127.') && process.env.NODE_ENV === 'production') {
      console.warn(`Unauthorised KlinkLabs Access Attempt from IP: ${clientIp}`);
      return new NextResponse("ERROR: Unauthorised IP Address", { status: 403 });
    }

    // استخراج البيانات
    const data = await parsePostbackData(req);

    const userId = data.userId;
    const transId = data.conversionId || `klink_${Date.now()}`;
    const status = data.status; 
    const eventType = data.eventType; 

    // منع أخطاء الـ Missing Parameters في حال كان الفحص يرسل بيانات ناقصة
    if (!userId || !data.payout) {
      console.warn("KlinkLabs Postback Warning: Missing parameters", data);
      return new NextResponse("ERROR: Missing Parameters", { status: 400 });
    }

    // 4. احتساب النقاط ديناميكياً من الـ Payout وحل مشكلة الـ 0 نقطة تماماً
    const rawPayout = parseFloat(String(data.payout).replace(/[^0-9.-]/g, '')) || 0;
    const absolutePayout = Math.abs(rawPayout);
    
    // معدل الصرف الخاص بتطبيقك (مثال: 2000 نقطة لكل 1 دولار)
    let calculatedPoints = absolutePayout * 2000; 
    if (calculatedPoints === 0) calculatedPoints = 100; // حد أدنى احترازي

    let finalReward = calculatedPoints;

    // 5. كشف حالات الخصم والمرتجعات (Chargeback) بشكل ذكي
    // إذا كانت الـ eventType هي 'chargeback' أو الحالة 'cancelled' أو الـ payout سالب:
    if (eventType === 'chargeback' || status === 'cancelled' || rawPayout < 0) {
      finalReward = -Math.abs(calculatedPoints); // تحويل القيمة لخصم (سالب)
    }

    const offerName = data.offerName || "Klink Task";
    const transactionRef = db.collection('transactions').doc(transId);

    // فلتر منع التكرار (Deduplication)
    if (!transId.startsWith('klink_')) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return new NextResponse("DUP", { status: 200 });
      }
    }

    // تنظيف معرف المستخدم في حال وجود بادئة فحص
    let cleanUserId = userId;
    if (cleanUserId.startsWith('TEST_')) {
      cleanUserId = cleanUserId.replace('TEST_', '');
    }

    const userRef = db.collection('users').doc(cleanUserId);
    const notificationRef = db.collection('notifications').doc();

    // 6. معاملة Firestore لتحديث البيانات والإشعارات في خطوة واحدة آمنة
    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // إنشاء مستخدم مؤقت لو كان الفحص يرسل userId عشوائي غير مسجل بالتطبيق
        ts.set(userRef, { points: finalReward, email: "klink_user@mrcash.app", createdAt: new Date() });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      // أ) تسجيل الحركة في الـ Transactions
      ts.set(transactionRef, {
        userId: cleanUserId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.offerId || 'klink_offer',
        offerName: `${offerName} (KlinkLabs)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ب) إرسال الإشعار بالنقاط الصحيحة الحقيقية (منع الـ 0)
      ts.set(notificationRef, {
        userId: cleanUserId,
        title: finalReward > 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: finalReward > 0 
          ? `Your account has been credited with +${finalReward} points for completing: [ ${offerName} ] from KlinkLabs.`
          : `Your account was deducted by ${Math.abs(finalReward)} points due to offer cancellation from KlinkLabs.`,
        type: finalReward > 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    console.error("KlinkLabs Postback Critical Error:", error.message);
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}

// دعم الـ GET لأننا اعتمدنا طريقة الـ GET الفعالة والمكشوفة في اللوحة
export async function GET(req: NextRequest) {
  return POST(req);
}
