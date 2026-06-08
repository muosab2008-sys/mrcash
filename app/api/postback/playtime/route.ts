import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // استخراج البيانات القادمة من رابط الـ Postback
    const userId = searchParams.get('user_id');
    const offerId = searchParams.get('offer_id');
    const amount = searchParams.get('amount'); 
    const signature = searchParams.get('signature');
    const event = searchParams.get('event');
    const offerName = searchParams.get('offer_name') || 'Offer';

    // التحقق من وجود المعاملات الأساسية
    if (!userId || !offerId || !amount || !signature || !event) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // جلب المتغيرات السرية التي أضفتها في Vercel
    const appKey = process.env.PLAYTIME_APP_KEY;
    const secretKey = process.env.PLAYTIME_SECRET_KEY;

    if (!appKey || !secretKey) {
      console.error("❌ خطأ: لم يتم العثور على PLAYTIME_APP_KEY أو PLAYTIME_SECRET_KEY في إعدادات Vercel!");
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    // حساب الـ Signature بناءً على الترتيب المطلوب في التوثيق الخاص بـ Playtime
    const stringToHash = `${userId}${offerId}${event}${appKey}${secretKey}`;
    const calculatedSignature = crypto.createHash('sha1').update(stringToHash).digest('hex');

    // التحقق من تطابق الـ Signature لحماية السيرفر من التلاعب
    if (signature !== calculatedSignature) {
      console.warn(`⚠️ محاولة طلب غير مصرح بها! Signature غير متطابق للمستخدم: ${userId}`);
      return NextResponse.json({ error: 'Invalid signature. Request untrusted.' }, { status: 403 });
    }

    const coinAmount = parseInt(amount, 10);

    // -------------------------------------------------------------
    // 🚀 هنا يتم معالجة النقاط وإرسال الإشعار
    // -------------------------------------------------------------
    
    console.log(`🎉 تم التحقق بنجاح! إضافة ${coinAmount} نقطة للمستخدم: ${userId}`);

    // استدعاء دالة الإشعار وتمرير البيانات لها
    await sendNotificationToUser(userId, coinAmount, offerName);

    // الرد على سيرفر Playtime بـ 200 OK لتأكيد الاستلام
    return NextResponse.json({ success: true, message: 'Postback processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Postback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// دالة إرسال الإشعار للمستخدم
async function sendNotificationToUser(userId, points, offerName) {
  // يمكنك هنا ربطها بـ Firebase Cloud Messaging (بما أنني أرى Firebase في متغيراتك)
  // أو عبر الـ Database لإظهار إشعار داخل التطبيق عند دخول المستخدم
  console.log(`🔔 إشعار للمستخدم ${userId}: مبروك! تم إضافة ${points} نقطة لحسابك من عرض [${offerName}].`);
}
