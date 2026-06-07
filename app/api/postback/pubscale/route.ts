import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

// 🚨 المفتاح السري الحقيقي الخاص بك من لوحة PubScale
const PUBSCALE_SECRET_KEY = "debb3049-9ccd-48c4-a0ae-38381db057a2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. جلب المتغيرات القادمة في الرابط بالملي
    let userId = searchParams.get('user_id');            
    const token = searchParams.get('token'); 
    const valueRaw = searchParams.get('value'); // قيمتها في الرابط الحين هي 1.5
    const signature = searchParams.get('signature');
    
    const offerName = searchParams.get('offer_name') || 'PubScale Task';
    const goalName = searchParams.get('goal_name') || '';
    const payoutUsd = searchParams.get('payout_usd') || '0';

    // التحقق من وجود المتغيرات الأساسية
    if (!userId || !token || !valueRaw || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 🎯 القيمة الحقيقية بالفواصل من أجل شحن الرصيد والإشعارات بدقة (مثل 1.5)
    const pointsToReward = parseFloat(valueRaw);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid reward value' }, { status: 400 });
    }

    // 🔒 2. جزء التدريب والأمان: تقريب الرقم لأسفل لحساب الـ Signature فقط كما يطلب التوثيق
    const pointsForSignature = Math.floor(pointsToReward);

    // الصيغة المطلوبة للأمان: secret_key.user_id.points.token
    const template = `${PUBSCALE_SECRET_KEY}.${userId}.${pointsForSignature}.${token}`;
    const calculatedSignature = crypto.createHash('md5').update(template).digest('hex');

    if (signature.toLowerCase() !== calculatedSignature.toLowerCase()) {
      console.error('[PubScale] Signature Mismatch!');
      return NextResponse.json({ error: 'Invalid hash signature' }, { status: 401 });
    }

    // 3. منع تكرار المعاملة
    const transactionId = `pubscale_${token}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 4. التحقق من وجود حساب المستخدم
    let userRef = adminDb.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      // حساب احتياطي للتست إذا كان اليوزر غير موجود
      userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; 
      userRef = adminDb.collection('users').doc(userId);
    }

    const displayGoal = goalName ? ` - ${goalName}` : '';
    const finalOfferTitle = `${offerName}${displayGoal}`;

    // 5. شحن النقاط بالفواصل الكاملة (1.5) وتسجيل المعاملة وإرسال الإشعار فوراً
    await adminDb.runTransaction(async (ts) => {
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward), // شحن بالفاصلة كاملة
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // حفظ المعاملة بالسجلات بالفواصل
      ts.set(transactionRef, {
        userId,
        points: pointsToReward,
        payoutUsd: parseFloat(payoutUsd),
        offerName: finalOfferTitle,
        status: 'completed',
        type: 'pubscale_payout',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // إشعار الجرس الفوري بالفواصل كاملة
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Offerwall Reward',
        message: `You received +${pointsToReward} points from PubScale for completing "${finalOfferTitle}".`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[PubScale Success] Credited +${pointsToReward} MC (with floats) to user ${userId}`);
    return NextResponse.json({ success: true, message: 'PubScale postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[PubScale Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
