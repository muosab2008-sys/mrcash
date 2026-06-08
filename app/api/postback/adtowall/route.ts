import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// دالة آمنة لتهيئة الفايربيز وتجنب التكرار والمشاكل على سيرفر Vercel
function initFirebase() {
  if (!admin.apps.length) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (!privateKey) throw new Error("FIREBASE_PRIVATE_KEY is missing");
      privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log("🎯 Firebase Admin Initialized for Adtowall");
    } catch (error) {
      console.error('❌ Firebase Admin Init Error:', error.message);
      throw error;
    }
  }
  return admin.firestore();
}

export async function GET(request) {
  try {
    // 1. تأمين المسار عبر حظر أي IP غير تابع لشركة Adtowall (IP Whitelisting)
    // نتحقق من الـ IP من خلال الـ Headers الممررة من Vercel
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';
    
    const ALLOWED_IP = "64.226.124.135"; // الـ IP الرسمي المحدد في ملف الشركة
    
    // ملاحظة: يمكنك تعطيل هذا التحقق مؤقتاً أثناء الفحص الشخصي، وتفعيله عند الإطلاق الفعلي
    if (clientIp !== ALLOWED_IP && process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ محاولة طلب غير مصرح بها من IP غريب: ${clientIp}`);
      return NextResponse.json({ error: 'Unauthorized IP address' }, { status: 403 });
    }

    const db = initFirebase();
    const { searchParams } = new URL(request.url);
    
    // 2. استخراج البيانات القادمة من رابط Adtowall
    const rawUserId = searchParams.get('user_id'); 
    const points = searchParams.get('points'); // عدد النقاط المحسوبة تلقائياً بناءً على عملتك
    const offerId = searchParams.get('offer_id');
    const offerName = searchParams.get('offer_name') || 'عرض جديد (Adtowall)';

    if (!rawUserId || !points || !offerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 3. تنظيف الـ userId في حال أرسلوا بادئة للتجربة
    let userId = rawUserId;
    if (userId.startsWith('TEST_')) {
      userId = userId.replace('TEST_', '');
    }

    const coinAmount = parseFloat(points);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // 4. تحديث Firestore بالنقاط والإشعارات باللغة العربية لـ MrCash
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('UserNotFound');
      }

      // تحديث النقاط وإجمالي الأرباح للمستخدم
      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(coinAmount),
        totalEarned: admin.firestore.FieldValue.increment(coinAmount)
      });

      // إضافة إشعار باللغة العربية داخل تطبيق MrCash
      const notificationRef = db.collection('notifications').doc();
      transaction.set(notificationRef, {
        uid: userId,
        title: '🎉 تهانينا! نقاط جديدة في رصيدك',
        message: `لقد ربحت بنجاح ${coinAmount} نقطة إضافية من خلال إكمال: (${offerName}) عبر جدار عروض Adtowall.`,
        type: 'reward',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`✅ Success (Adtowall): Points and notification added for ${userId}`);
    return NextResponse.json({ success: true, message: 'Adtowall Postback processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('❌ Adtowall Error:', error.message);
    if (error.message === 'UserNotFound') {
      return NextResponse.json({ error: 'User not found in Firestore' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}
