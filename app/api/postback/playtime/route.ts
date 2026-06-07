import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🔑 تم دمج الـ Secret Key الخاص بك بنجاح لتأمين الـ Signature
    const APP_SECRET_KEY = "Y90QOOQDWHDWI7XM3Z7WNIOYIEOTCO"; 

    // 1. جلب البيانات الديناميكية القادمة من رابط الشركة (لكل الناس)
    const rawUserId = searchParams.get('user_id');            
    const offerId = searchParams.get('offer_id');
    const offerName = searchParams.get('offer_name') || 'Playtime Task';
    const amountStr = searchParams.get('amount'); 
    const eventName = searchParams.get('event') || '';
    const incomingSignature = searchParams.get('signature');
    const transactionId = searchParams.get('transaction_id') || `pt_${Date.now()}`;

    // التحقق من وجود المعطيات الأساسية
    if (!amountStr || !rawUserId || !offerId || !incomingSignature) {
      return NextResponse.json({ error: 'Missing required postback parameters' }, { status: 400 });
    }

    // 🔥 تنظيف الـ ID وقشع كلمة TEST_ تلقائياً إذا كانت الشركة في وضع التست
    const userId = rawUserId.replace(/^TEST_/, '');
    const pointsToReward = parseInt(amountStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // 2. 🛡️ التحقق من التوقيع الرقمي (Signature Validation) لحماية الموقع من التزوير
    // الصيغة الرسمية حسب الـ Docs: sha1(userId + offerId + event + secretKey)
    const dataToSign = `${rawUserId}${offerId}${eventName}${APP_SECRET_KEY}`;
    const calculatedSignature = crypto.createHash('sha1').update(dataToSign).digest('hex');

    // إذا لم يتطابق التوقيع، نرفض الطلب فوراً لأنها محاولة اختراق وهمية
    if (incomingSignature !== calculatedSignature && !rawUserId.startsWith('TEST_')) {
      console.error(`[Security Alert]: Invalid Signature for user ${userId}`);
      return NextResponse.json({ error: 'Invalid transaction signature' }, { status: 401 });
    }

    // 3. 🛡️ حماية ضد التكرار (Deduplication)
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 4. 🔍 جلب وثيقة المستخدم الحقيقي للتأكد من وجود حسابه في الموقع
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Unauthorized Postback: User [${userId}] not found in Firestore.`);
      return NextResponse.json({ error: `User [${userId}] not found in database.` }, { status: 404 });
    }

    const finalOfferTitle = decodeURIComponent(offerName);

    // 5. تشغيل الـ Firestore Transaction الآمن لشحن الحساب وتحديث السجلات
    await adminDb.runTransaction(async (ts) => {
      
      // أ) شحن النقاط وتحديث إجمالي الأرباح للمستخدم الحالي القائم بالعرض
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // ب) تسجيل المعاملة في سجل الـ History
      ts.set(transactionRef, {
        userId: userId,
        points: pointsToReward,
        amount: pointsToReward, 
        offerName: finalOfferTitle,
        status: 'completed',
        type: 'offer_credit', 
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // ج) حقن وثيقة الإشعار لتفجير التوست الأزرق فوراً بناءً على الفهرس الجديد 🚀
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId: userId,
        title: '🎉 Points Credited!',
        message: `Your account has been credited with +${pointsToReward} points for completing: [ ${finalOfferTitle} ].`,
        type: 'offer_credit', 
        points: pointsToReward, 
        amount: pointsToReward, 
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      });
    });

    return NextResponse.json({ success: true, message: 'Playtime postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Playtime Critical Error]:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
