import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

// 1. حماية وتهيئة Firebase Admin بشكل داخلي وصارم لمنع أي خطأ في مسارات الملفات (Module Not Found)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // معالجة الـ السطور الجديدة \n في المفتاح الخاص لضمان عمله على Vercel بدون مشاكل
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.message);
  }
}

const db = admin.firestore();

// دالة توليد هاش MD5 لمطابقة التوقيع الرقمي مع شركة Offery
function generateMd5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    // 2. استقبال البيانات القادمة من السيرفر (POST Request)
    const data = await req.json();

    const subId = data.subId;          // معرف المستخدم (userId)
    const transId = data.transId;      // معرف المعاملة الفريد من الشركة
    const reward = data.reward;        // قيمة النقاط القادمة (مثال: 1.50)
    const status = data.status;        // الحالة (1 = إضافة نقاط، 2 = سحب/مرتجع)
    const signature = data.signature;  // التوقيع المرسل للتحقق من الأمان

    // 3. جلب المفتاح السري الموثق في إعدادات Vercel
    const SECRET_KEY = process.env.OFFERY_SECRET_KEY;

    if (!SECRET_KEY) {
      console.error("Missing OFFERY_SECRET_KEY in Vercel environment variables");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    // 4. التحقق الفولاذي من التوقيع الرقمي (Signature Verification) لمنع التزوير
    // المعادلة القياسية: subId + transId + reward + SECRET_KEY
    const expectedSignature = generateMd5(`${subId}${transId}${reward}${SECRET_KEY}`);

    if (expectedSignature !== signature) {
      console.warn(`Security Alert: Invalid signature hash for transaction: ${transId}`);
      return new NextResponse("ERROR: Signature doesn't match", { status: 400 });
    }

    // 5. حساب النقاط بدقة شديدة مع الاحتفاظ بالفواصل العشرية (Float)
    let finalReward = parseFloat(reward);
    if (isNaN(finalReward)) {
      return new NextResponse("ERROR: Invalid reward format", { status: 400 });
    }

    // التعامل مع حالات الـ Chargeback (إذا كان الستيتس 2 يتم تحويل القيمة لسالب تلقائياً)
    if (status === 2 || status === '2') {
      finalReward = -Math.abs(finalReward);
    }

    // 6. حماية من التكرار (Idempotency) - التأكد أن المعاملة لم تشحن من قبل
    const transactionRef = db.collection('transactions').doc(transId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      // إذا كانت المعاملة قد تمت معالجتها سابقاً، نرد بـ ok فوراً لمنع التكرار وحفظ الموارد
      return new NextResponse("ok", { status: 200 });
    }

    // 7. تشغيل التحديث عبر Firestore Transaction لضمان التزامن وحماية البيانات
    const userRef = db.collection('users').doc(subId);
    const notificationRef = db.collection('notifications').doc(); // إنشاء معرف إشعار فريد

    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error("User does not exist in database");
      }

      // جلب نقاط المستخدم الحالية وإضافة النقاط الجديدة (مع الفواصل بالملي)
      const currentPoints = userDoc.data()?.points || 0;
      const newPoints = currentPoints + finalReward;

      // أ) تحديث رصيد المستخدم
      ts.update(userRef, { points: newPoints });

      // ب) تسجيل العملية في الـ History
      ts.set(transactionRef, {
        userId: subId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.offer_id || 'unknown',
        offerName: data.offer_name || 'Offery Offer',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ج) إرسال الإشعار اللحظي للمستخدم داخل الموقع
      ts.set(notificationRef, {
        userId: subId,
        title: finalReward > 0 ? "🎉 تم شحن رصيدك بنجاح!" : "⚠️ تنبيه: سحب نقاط",
        message: finalReward > 0 
          ? `مبروك! لقد كسبت ${finalReward} نقطة من إكمال العرض: ${data.offer_name || 'Offery'}.`
          : `تم خصم ${Math.abs(finalReward)} نقطة من حسابك بسبب إلغاء العرض من الشركة.`,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 8. الرد بكلمة "ok" الإلزامية لكي تسجل شركة Offery أن الطلب ناجح بنسبة 100%
    return new NextResponse("ok", { status: 200 });

  } catch (error: any) {
    console.error("Offery Postback Final Error:", error.message);
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}
