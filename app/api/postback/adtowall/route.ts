import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

const ALLOWED_IP = '64.226.124.135';

export async function GET(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip;

    if (clientIp !== ALLOWED_IP) {
      return NextResponse.json({ error: 'Unauthorized IP access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const payoutUsd = searchParams.get('payout_usd');      
    const pointsStr = searchParams.get('points');          
    let userId = searchParams.get('user_id');            
    let offerName = searchParams.get('offer_name') || 'Adtowall Task';
    const transactionId = searchParams.get('transaction_id');

    // تنظيف اسم العرض تماماً
    if (offerName.includes('[WW]') || offerName.toLowerCase().includes('www')) {
      offerName = 'Adtowall Task';
    }

    if (!pointsStr || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pointsToReward = parseInt(pointsStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // التحقق من الحساب والتحويل الاحتياطي لحسابك الشخصي
    let isTesting = false;
    let userRef = adminDb.collection('users').doc(userId || 'none');
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      userId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 
      userRef = adminDb.collection('users').doc(userId);
      userDoc = await userRef.get();
      isTesting = true; // نعم، نحن في وضع الفحص التجريبي لحسابك
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    await adminDb.runTransaction(async (ts) => {
      // تحديث حقول الرصيد مباشرة
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // لمنع تعليق النص في الشاشة أثناء الفحص، لن نقوم بإنشاء مستند معاملات عام يعيق الواجهة إذا كان الاختبار موجهاً لحسابك يدوياً
      if (!isTesting) {
        ts.set(transactionRef, {
          userId,
          points: pointsToReward,
          payoutUsd: parseFloat(payoutUsd || '0'),
          offerName,
          status: 'completed',
          type: 'offerwall',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // إضافة إشعار الجرس الأنيق والغير مقروء (يظهر رقم 1 فوق الجرس تلقائياً)
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Points Credited',
        message: `You received +${pointsToReward} points from Adtowall for completing "${offerName}" task.`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, message: 'Postback completed' }, { status: 200 });

  } catch (error: any) {
    console.error('[Adtowall Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
