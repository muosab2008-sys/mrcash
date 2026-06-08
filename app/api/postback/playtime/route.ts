import { NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

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
      console.log("🎯 Firebase Admin Initialized");
    } catch (error) {
      console.error('❌ Firebase Admin Init Error:', error.message);
      throw error;
    }
  }
  return admin.firestore();
}

export async function GET(request) {
  try {
    const db = initFirebase();
    const { searchParams } = new URL(request.url);
    
    // استخراج البيانات القادمة من الرابط
    const rawUserId = searchParams.get('user_id'); 
    const offerId = searchParams.get('offer_id');
    const amount = searchParams.get('amount'); 
    const signature = searchParams.get('signature');
    const event = searchParams.get('event');
    
    // جلب اسم العرض، وإذا كان تجريبياً نقوم بتعريبه تلقائياً للتأكد
    let offerName = searchParams.get('offer_name') || 'عرض جديد';
    if (offerName === 'TEST_OFFER') {
      offerName = 'عرض تجريبي';
    }

    if (!rawUserId || !offerId || !amount || !signature || !event) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. التحقق من الـ Signature
    const appKey = process.env.PLAYTIME_APP_KEY;
    const secretKey = process.env.PLAYTIME_SECRET_KEY;
    const stringToHash = `${rawUserId}${offerId}${event}${appKey}${secretKey}`;
    const calculatedSignature = crypto.createHash('sha1').update(stringToHash).digest('hex');

    if (signature !== calculatedSignature) {
      console.warn(`⚠️ Signature Mismatch`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // 2. تنظيف الـ userId للبحث عنه في Firestore (تنظيف TEST_ من البداية)
    let userId = rawUserId;
    if (userId.startsWith('TEST_')) {
      userId = userId.replace('TEST_', '');
    }

    const coinAmount = parseFloat(amount);
    if (isNaN(coinAmount) || coinAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount value' }, { status: 400 });
    }

    // 3. تحديث Firestore بالنقاط والإشعارات باللغة العربية
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('UserNotFound');
      }

      // تحديث النقاط وإجمالي الأرباح
      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(coinAmount),
        totalEarned: admin.firestore.FieldValue.increment(coinAmount)
      });

      // إضافة إشعار باللغة العربية الفصحى إلى Firestore لتطبيق MrCash
      const notificationRef = db.collection('notifications').doc();
      transaction.set(notificationRef, {
        uid: userId,
        title: '🎉 تهانينا! نقاط جديدة في رصيدك',
        message: `لقد ربحت بنجاح ${coinAmount} نقطة إضافية من خلال إكمال: (${offerName}). استمر في تجميع الأرباح!`,
        type: 'reward',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`✅ Success: Points and Arabic notification added for ${userId}`);
    return NextResponse.json({ success: true, message: 'Processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message === 'UserNotFound') {
      return NextResponse.json({ error: 'User not found in Firestore' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}
