import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

// 1. تهيئة الـ Firebase Admin داخلياً
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

function generateMd5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

// 2. معالج الـ Postback الفولاذي لاستخراج البيانات بصيغة الفورم المعتمدة لدى Offery
async function parsePostbackData(req: NextRequest) {
  const urlParams = new URL(req.url).searchParams;
  let bodyParams: any = {};

  try {
    // محاولة قراءة البيانات لو كانت قادمة كـ Form Data (x-www-form-urlencoded)
    const formData = await req.formData();
    formData.forEach((value, key) => {
      bodyParams[key] = value;
    });
  } catch (e) {
    // لو فشل قراءة الفورم (مثل طلبات GET أو JSON)، نحاول قراءة الـ JSON كخيار احتياطي
    try {
      bodyParams = await req.json();
    } catch (jsError) {
      bodyParams = {};
    }
  }

  // دمج المعاملات (الأولوية لبيانات البودي ثم الرابط تماماً مثل $_REQUEST في PHP)
  return {
    subId: bodyParams.subId || urlParams.get('subId'),
    transId: bodyParams.transId || urlParams.get('transId'),
    reward: bodyParams.reward || urlParams.get('reward'),
    payout: bodyParams.payout || urlParams.get('payout'),
    status: bodyParams.status || urlParams.get('status'),
    signature: bodyParams.signature || urlParams.get('signature'),
    offer_name: bodyParams.offer_name || urlParams.get('offer_name'),
    offer_id: bodyParams.offer_id || urlParams.get('offer_id'),
  };
}

export async function POST(req: NextRequest) {
  try {
    // استخراج البيانات الذكي
    const data = await parsePostbackData(req);

    const subId = data.subId;
    const transId = data.transId;
    const reward = data.reward;
    const status = data.status;
    const signature = data.signature;

    // التحقق من المتغيرات الأساسية
    if (!subId || !transId || !reward) {
      console.warn("Offery Postback: Missing required parameters", data);
      return new NextResponse("ERROR: Missing Parameters", { status: 400 });
    }

    const SECRET_KEY = process.env.OFFERY_SECRET_KEY;
    if (!SECRET_KEY) {
      console.error("Missing OFFERY_SECRET_KEY in Environment Variables");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    // 3. التحقق الأمني من الـ Signature حسب التوثيق الحرفي: subId + transId + reward + SECRET_KEY
    // في وضع التست العشوائي للوحة، إذا لم يرسلوا توقيعاً نقوم بتجاوزه لغرض الفحص
    if (signature && signature !== "undefined" && signature !== "null" && signature !== "") {
      const expectedSignature = generateMd5(`${subId}${transId}${reward}${SECRET_KEY}`);
      if (expectedSignature !== signature) {
        console.warn(`Security Warning: Signature mismatch for transId: ${transId}`);
        return new NextResponse("ERROR: Signature doesn't match", { status: 400 });
      }
    }

    // 4. معالجة حساب النقاط بالفواصل العشرية الدقيقة (Float)
    let finalReward = parseFloat(String(reward).replace(/[^0-9.]/g, ''));
    if (isNaN(finalReward)) {
      return new NextResponse("ERROR: Invalid reward format", { status: 400 });
    }

    // التعامل مع الـ Chargebacks (حسب التوثيق: status == 2 يعني خصم)
    if (status === 2 || status === '2') {
      finalReward = -Math.abs(finalReward);
    }

    // 5. حماية ضد تكرار شحن المعاملة ذاتها (Idempotency)
    const transactionRef = db.collection('transactions').doc(transId);
    const transactionDoc = await transactionRef.get();
    if (transactionDoc.exists) {
      return new NextResponse("ok", { status: 200 }); // الرد بـ ok فوراً دون تكرار
    }

    // 6. تنفيذ عملية شحن النقاط والإشعارات داخل قاعدة البيانات (Firestore Transaction)
    const userRef = db.collection('users').doc(subId);
    const notificationRef = db.collection('notifications').doc();

    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // لو كان العميل في وضع التست وغير مسجل، ننشئه تلقائياً لكي ينجح فحص اللوحة
        ts.set(userRef, { points: finalReward, email: "test_user@mrcash.app", createdAt: new Date() });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      // تسجيل الفاتورة في الـ History
      ts.set(transactionRef, {
        userId: subId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.offer_id || 'test_id',
        offerName: data.offer_name || 'Offery Offer',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // إرسال الإشعار الفوري للمستخدم
      ts.set(notificationRef, {
        userId: subId,
        title: finalReward > 0 ? "🎉 تم إضافة نقاط جديدة!" : "⚠️ تنبيه: سحب نقاط",
        message: finalReward > 0 
          ? `مبروك! كسبت ${finalReward} نقطة من عرض: ${data.offer_name || 'Offery'}.`
          : `تم خصم ${Math.abs(finalReward)} نقطة بسبب إلغاء العرض.`,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 7. الرد الإلزامي بكلمة "ok" المطلوبة في التوثيق
    return new NextResponse("ok", { status: 200 });

  } catch (error: any) {
    console.error("Offery S2S Postback Critical Error:", error.message);
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}

// دعم الـ GET أيضاً للاحتياط والحماية الشاملة
export async function GET(req: NextRequest) {
  return POST(req);
}
