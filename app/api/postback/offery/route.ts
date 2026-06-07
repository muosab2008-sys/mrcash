import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin'; // تأكد من مسار استدعاء Firebase Admin حقتك
import crypto from 'crypto';

// دالة مخصصة لإنشاء هاش MD5 تماماً مثل PHP
function md5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    // 1. استقبال البيانات القادمة من شركة Offery عبر الـ Body (POST Request)
    const data = await req.json();

    const subId = data.subId;          // معرف المستخدم عندك (userId)
    const transId = data.transId;      // معرف المعاملة الفريد من الشركة
    const reward = data.reward;        // قيمة النقاط (مثال: 1.25)
    const status = data.status;        // الحالة (1 = إضافة، 2 = خصم/مرتجع)
    const signature = data.signature;  // الهاش القادم للتحقق من الأمان

    // 2. جلب المفتاح السري الخاص بـ Offery المخزن بأمان في Vercel Env
    const SECRET_KEY = process.env.OFFERY_SECRET_KEY;

    if (!SECRET_KEY) {
      console.error("Missing OFFERY_SECRET_KEY in environment variables");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    // 3. التحقق من التوقيع الرقمي (Signature Verification) لمنع التزوير والهكرز
    // المعادلة حسب التوثيق: subId + transId + reward + SECRET_KEY
    const localHash = md5(`${subId}${transId}${reward}${SECRET_KEY}`);

    if (localHash !== signature) {
      console.warn(`Security Warning: Invalid signature for transaction ${transId}`);
      return new NextResponse("ERROR: Signature doesn't match", { status: 400 });
    }

    // 4. حساب القيمة النهائية للنقاط بناءً على حالة الـ Status (إضافة أم سحب)
    let finalReward = parseFloat(reward);
    if (status === 2 || status === '2') {
      finalReward = -Math.abs(finalReward); // تحويل القيمة لـ سالب في حال الـ Chargeback
    }

    // 5. حماية من التكرار (Idempotency) - التحقق بداخل الفايربيس هل المعاملة مسجلة مسبقاً؟
    const transactionRef = db.collection('transactions').doc(transId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      // إذا كانت المعاملة مضافة مسبقاً، نرد بـ ok فوراً لمنع تكرار شحن النقاط مجدداً
      return new NextResponse("ok", { status: 200 });
    }

    // 6. تشغيل عملية تحديث قاعدة البيانات بشكل آمن ومترابط (Firestore Transaction)
    const userRef = db.collection('users').doc(subId);

    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const currentPoints = userDoc.data()?.points || 0;
      const newPoints = currentPoints + finalReward;

      // تحديث نقاط المستخدم
      ts.update(userRef, { points: newPoints });

      // حفظ المعاملة لعدم تكرارها وبناء سجل عمليات للمستخدم (History)
      ts.set(transactionRef, {
        userId: subId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.offer_id || 'unknown',
        offerName: data.offer_name || 'Offery Offer',
        timestamp: new Date(),
        status: 'completed'
      });
    });

    // 7. الرد بكلمة "ok" المطلوبة حتماً من سيرفرات Offery لتأكيد النجاح
    return new NextResponse("ok", { status: 200 });

  } catch (error: any) {
    console.error("Offery Postback Error:", error.message);
    // حتى في حال حدوث خطأ داخلي بسبب عدم وجود المستخدم مثلاً، نرد بـ 400 لتعرف الشركة بوجود خلل في الـ subId
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}
