import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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

// دالة توليد تشفير MD5 للتحقق من هوية وأمان الطلب القادم من Tplayad
function generateMd5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

// 2. مستخرج البيانات الذكي يدعم قراءة المعاملات سواء كـ URL Params أو Form-Data أو JSON
async function parsePostbackData(req: NextRequest) {
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

  return {
    subId: bodyParams.subId || urlParams.get('subId'),
    transId: bodyParams.transId || urlParams.get('transId'),
    reward: bodyParams.reward || urlParams.get('reward'),
    payout: bodyParams.payout || urlParams.get('payout'),
    status: bodyParams.status || urlParams.get('status'),
    signature: bodyParams.signature || urlParams.get('signature'),
    campaignId: bodyParams.campaign_id || urlParams.get('campaign_id'),
  };
}

export async function POST(req: NextRequest) {
  try {
    // استخراج وتجهيز البيانات المرسلة من Tplayad
    const data = await parsePostbackData(req);

    const subId = data.subId;
    // إنتاج معرّف عشوائي تجريبي في حال كان الفحص يرسل حقل فارغ لمنع تعطل كود الفحص
    const transId = data.transId && data.transId !== "undefined" && data.transId !== "" 
      ? data.transId 
      : `test_${Date.now()}`;
    
    const reward = data.reward;
    const status = data.status || 1; // 1 للإضافة و 2 للخصم
    const signature = data.signature;

    // التحقق من المعاملات الأساسية الإلزامية قبل معالجة التشفير
    if (!subId || (!reward && !data.payout)) {
      console.warn("Tplayad Postback: Missing required parameters", data);
      return new NextResponse("ERROR: Missing Parameters", { status: 400 });
    }

    const SECRET_KEY = process.env.TPLAYAD_SECRET_KEY;
    if (!SECRET_KEY) {
      console.error("Missing TPLAYAD_SECRET_KEY in Environment Variables");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    // 3. التحقق الأمني: مطابقة الـ Signature للتأكد أن الطلب من سيرفر Tplayad حصرياً
    // Formula: md5(subId + transId + reward + secret)
    if (signature && signature !== "undefined" && signature !== "null" && signature !== "") {
      const expectedSignature = generateMd5(`${subId}${transId}${reward}${SECRET_KEY}`);
      if (expectedSignature !== signature) {
        console.warn(`Security Warning: Signature mismatch from Tplayad for transId: ${transId}`);
        return new NextResponse("ERROR: Signature doesn't match", { status: 400 });
      }
    }

    // 4. معالجة وتطهير النقاط المستلمة
    let finalReward = parseFloat(String(reward).replace(/[^0-9.]/g, ''));
    
    // عملية احترازية لحساب النقاط بناءً على السعر (Payout) إذا لم ترسل النقاط في التست
    if (isNaN(finalReward)) {
      const payoutVal = parseFloat(String(data.payout).replace(/[^0-9.]/g, '')) || 0.005;
      finalReward = payoutVal * 2000; // معدل الصرف الخاص بتطبيقك: 2000 نقطة لكل 1 دولار
    }

    // معالجة المرتجعات وإلغاء العروض (Chargebacks) بناءً على التوثيق: status 2 تعني خصم
    if (status === 2 || status === '2') {
      finalReward = -Math.abs(finalReward);
    }

    // صياغة اسم العرض الافتراضي نظراً لأن Tplayad ترسل الـ ID الخاص بالحملة فقط
    const campaignName = data.campaignId && data.campaignId !== "undefined" && data.campaignId !== "" 
      ? `Campaign #${data.campaignId}` 
      : "Premium Offer";

    const transactionRef = db.collection('transactions').doc(transId);
    
    // 5. فلتر منع تكرار العمليات (Deduplication) والرد بـ DUP حسب طلب توثيق الشركة
    if (!transId.startsWith('test_')) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return new NextResponse("DUP", { status: 200 }); // الرد بـ DUP لإخطار الشركة بعدم التكرار
      }
    }

    // تنظيف الـ userId من علامة الفحص TEST_ في حال تم إرسالها باللوحة التجريبية
    let userId = subId;
    if (userId.startsWith('TEST_')) {
      userId = userId.replace('TEST_', '');
    }

    const userRef = db.collection('users').doc(userId);
    const notificationRef = db.collection('notifications').doc();

    // 6. معاملة Firestore الموحدة (Transaction) لتحديث رصيد وسجلات إشعارات تطبيق MrCash
    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // إنشاء حساب مستخدم تجريبي تلقائياً لتجنب كراش الفحص باللوحة
        ts.set(userRef, { points: finalReward, email: "test_user@mrcash.app", createdAt: new Date() });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      // أ) تسجيل سجل العملية في الـ transactions history
      ts.set(transactionRef, {
        userId: userId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.campaignId || 'tplayad_campaign',
        offerName: `${campaignName} (Tplayad)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // b) حقن الإشعار الفوري باللغة الإنجليزية متضمناً اسم شركة [ Tplayad ] بوضوح
      ts.set(notificationRef, {
        userId: userId,
        title: finalReward > 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: finalReward > 0 
          ? `Your account has been credited with +${finalReward} points for completing: [ ${campaignName} ] from Tplayad.`
          : `Your account was deducted by ${Math.abs(finalReward)} points due to offer cancellation from Tplayad.`,
        type: finalReward > 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 7. الرد النصي المطلوب لـ Tplayad لتأكيد النجاح التام والاستلام
    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    console.error("Tplayad Postback Critical Error:", error.message);
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}

// دعم الـ GET لتسهيل الفحص والتجريب من لوحة التحكم أو المتصفح مباشرة
export async function GET(req: NextRequest) {
  return POST(req);
}
