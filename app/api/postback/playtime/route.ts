import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. جلب الـ user_id الديناميكي بأي صيغة
    let rawUserId = searchParams.get('user_id') || searchParams.get('subId') || searchParams.get('uid');
    
    if (!rawUserId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    // 🔥 الحركة الذكية: تنظيف الـ ID وقشع كلمة TEST_ في حال أرسلتها الشركة أثناء الفحص
    const userId = rawUserId.replace(/^TEST_/, '');

    // جلب النقاط بأي صيغة (amount أو points أو reward)
    const amountStr = searchParams.get('amount') || searchParams.get('points') || searchParams.get('reward'); 

    const offerId = searchParams.get('offer_id') || '123';
    const offerName = searchParams.get('offer_name') || 'Playtime Task';
    const taskId = searchParams.get('task_id') || '1';
    const taskName = searchParams.get('task_name') || '';
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transId') || `pt_${Date.now()}`;

    if (!amountStr) {
      return NextResponse.json({ error: 'Missing amount parameter' }, { status: 400 });
    }

    const pointsToReward = parseInt(amountStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // 2. 🛡️ حماية ضد التكرار
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 3. 🔍 جلب وثيقة المستخدم الحقيقي بعد التنظيف
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    // إذا لم يتم العثور على الحساب حتى بعد التنظيف
    if (!userDoc.exists) {
      console.warn(`Unauthorized Postback: User [${userId}] not found.`);
      return NextResponse.json({ error: `User [${userId}] not found in database.` }, { status: 404 });
    }

    const displayTask = taskName ? ` - ${taskName}` : '';
    const finalOfferTitle = `${offerName}${displayTask}`;

    // 4. تشغيل الـ Transaction وشحن النقاط للمستخدم الفعلي
    await adminDb.runTransaction(async (ts) => {
      
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      ts.set(transactionRef, {
        userId: userId,
        points: pointsToReward,
        amount: pointsToReward, 
        offerName: finalOfferTitle,
        status: 'completed',
        type: 'offer_credit', 
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

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
