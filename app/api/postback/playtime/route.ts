import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات العادية والطبيعية من الرابط
    let userId = searchParams.get('user_id');            
    const offerId = searchParams.get('offer_id') || '123';
    let offerName = searchParams.get('offer_name') || 'Playtime Task';
    const amountStr = searchParams.get('amount'); // النقاط القادمة باسم amount
    const taskId = searchParams.get('task_id') || '1';
    const taskName = searchParams.get('task_name') || '';
    const transactionId = searchParams.get('transaction_id') || `pt_${Date.now()}`;

    if (!amountStr || !userId) {
      return NextResponse.json({ error: 'Missing user_id or amount' }, { status: 400 });
    }

    const pointsToReward = parseInt(amountStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // التحقق من عدم تكرار المعاملة لحماية الموقع
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // التحقق من حسابك الفعلي لشحن النقاط فيه مباشرة
    let userRef = adminDb.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; 
      userRef = adminDb.collection('users').doc(userId);
    }

    const displayTask = taskName ? ` - ${taskName}` : '';
    const finalOfferTitle = `${offerName}${displayTask}`;

    await adminDb.runTransaction(async (ts) => {
      // 1. شحن النقاط مباشرة في حسابك
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // 2. تسجيل العملية بالسجلات لحماية الواجهة من التعليق
      ts.set(transactionRef, {
        userId,
        points: pointsToReward,
        offerName: finalOfferTitle,
        status: 'completed',
        type: 'playtime_payout',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. إضافة إشعار الجرس بالإنجليزية النظيفة
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Points Credited',
        message: `You received +${pointsToReward} points from Playtime for completing "${finalOfferTitle}" task.`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, message: 'Playtime postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Playtime Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
