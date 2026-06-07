import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. جلب الـ user_id الديناميكي القادم من رابط الشركة مباشرة
    const userId = searchParams.get('user_id');            
    const offerId = searchParams.get('offer_id') || '123';
    const offerName = searchParams.get('offer_name') || 'Playtime Task';
    const amountStr = searchParams.get('amount'); 
    const taskId = searchParams.get('task_id') || '1';
    const taskName = searchParams.get('task_name') || '';
    const transactionId = searchParams.get('transaction_id') || `pt_${Date.now()}`;

    // التحقق من وجود المعطيات الأساسية للطلب
    if (!amountStr || !userId) {
      return NextResponse.json({ error: 'Missing user_id or amount' }, { status: 400 });
    }

    const pointsToReward = parseInt(amountStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // 2. التحقق من عدم تكرار المعاملة (حماية ضد الـ Replay Attacks)
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 3. 🛡️ جلب وثيقة المستخدم الحقيقي من الفايربيس شريطة وجوده فعلياً
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    // 🛑 حماية فولاذية: إذا كان الـ user_id وهمي أو غير موجود، نرفض الطلب فوراً ونمنع اختراق النقاط
    if (!userDoc.exists) {
      console.warn(`Unauthorized Postback: User ${userId} does not exist in Database.`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const displayTask = taskName ? ` - ${taskName}` : '';
    const finalOfferTitle = `${offerName}${displayTask}`;

    // 4. تشغيل الـ Transaction الآمن لشحن حساب المستخدم الفعلي القائم بالعملية
    await adminDb.runTransaction(async (ts) => {
      // شحن النقاط في حساب هذا المستخدم بالظبط
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // تسجيل العملية في السجلات باسمه
      ts.set(transactionRef, {
        userId: userId,
        points: pointsToReward,
        amount: pointsToReward, 
        offerName: finalOfferTitle,
        status: 'completed',
        type: 'offer_credit', 
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // إرسال الإشعار والتوست لحسابه هو مباشرة بناءً على الفهرس الجديد 🚀
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
    console.error('[Playtime Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
