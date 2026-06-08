import { NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

// تهيئة Firebase Admin SDK إذا لم يكن مهيأً بالفعل
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // معالجة مشكلة السطور الجديدة في المفتاح الخاص عند رفعه على Vercel
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج المعاملات القادمة من Playtime SDK
    const userId = searchParams.get('user_id'); // هذا يمثل الـ uid للمستخدم لدينا
    const offerId = searchParams.get('offer_id');
    const amount = searchParams.get('amount'); 
    const signature = searchParams.get('signature');
    const event = searchParams.get('event');
    const offerName = searchParams.get('offer_name') || 'عرض جديد';

    // التحقق من وجود المعاملات الأساسية للـ Postback
    if (!userId || !offerId || !amount || !signature || !event) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 2. جلب المفاتيح من متغيرات البيئة في Vercel
    const appKey = process.env.PLAYTIME_APP_KEY;
    const secretKey = process.env.PLAYTIME_SECRET_KEY;

    // 3. التحقق من الـ Signature للحماية والأمان
    const stringToHash = `${userId}${offerId}${event}${appKey}${secretKey}`;
    const calculatedSignature = crypto.createHash('sha1').update(stringToHash).digest('hex');

    if (signature !== calculatedSignature) {
      console.warn(`⚠️ محاولة غير مصرح بها للـ Signature من المستخدم: ${userId}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const coinAmount = parseFloat(amount);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return NextResponse.json({ error: 'Invalid points amount' }, { status: 400 });
    }

    // 4. تحديث بيانات المستخدم في Firestore وإضافة إشعار داخل العملية (Transaction)
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found in database');
      }

      // زيادة النقاط الحالية وإجمالي الأرباح تلقائياً وبأمان
      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(coinAmount),
        totalEarned: admin.firestore.FieldValue.increment(coinAmount)
      });

      // إضافة وثيقة إشعار جديدة في مجموعة notifications
      const notificationRef = db.collection('notifications').doc();
      transaction.set(notificationRef, {
        uid: userId,
        title: '🎉 تم إضافة نقاط جديدة!',
        message: `مبروك! لقد حصلت على ${coinAmount} نقطة من إكمال عرض: ${offerName}`,
        type: 'reward',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`✅ بنجاح: تم إضافة ${coinAmount} نقطة للمستخدم ${userId} وإرسال الإشعار.`);
    
    // الرد على سيرفر Playtime لتأكيد النجاح والاستلام
    return NextResponse.json({ success: true, message: 'Postback processed and Firestore updated' }, { status: 200 });

  } catch (error) {
    console.error('❌ Postback Process Error:', error.message);
    if (error.message === 'User not found in database') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
