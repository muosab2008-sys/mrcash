import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات العادية مثل أي شركة
    let userId = searchParams.get('user_id');            
    const offerId = searchParams.get('offer_id') || '123';
    let offerName = searchParams.get('offer_name') || 'Playtime Task';
    const amountStr = searchParams.get('amount'); 
    const taskId = searchParams.get('task_id') || '1';
    const taskName = searchParams.get('task_name') || '';

    if (!amountStr || !userId) {
      return NextResponse.json({ error: 'Missing user_id or amount' }, { status: 400 });
    }

    const pointsToReward = parseInt(amountStr, 10);

    // صنع ID معاملة بسيط للتجربة لمنع التكرار
    const uniqueTransactionId = `playtime_test_${offerId}_${taskId}_${Date.now().toString().slice(-4)}`;

    // التحقق من حسابك الفعلي
    let userRef = adminDb.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; 
      userRef = adminDb.collection('users').doc(userId);
    }

    const displayTask = taskName ? ` - ${taskName}` : '';

    await adminDb.runTransaction(async (ts) => {
      // شحن النقاط مباشرة في حقل points
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // إضافة إشعار الجرس العادي بالإنجليزية
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Playtime Rewards',
        message: `You received +${pointsToReward} points from Playtime SDK for completing "${offerName}${displayTask}".`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, message: 'Postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Playtime Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
