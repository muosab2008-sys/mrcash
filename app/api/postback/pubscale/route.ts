import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; // مدمج في Node.js لعمل تشفير MD5

// 🚨 استبدل هذا بالمفتاح السري الحقيقي (Secret Key) من لوحة تحكم PubScale
const PUBSCALE_SECRET_KEY = "debb3049-9ccd-48c4-a0ae-38381db057a2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات الأساسية من PubScale
    let userId = searchParams.get('user_id');            
    const token = searchParams.get('token'); // المعرف الفريد للمعاملة لمنع التكرار
    const valueRaw = searchParams.get('value'); // قيمة النقاط
    const signature = searchParams.get('signature');
    
    // متغيرات إضافية اختيارية لتحسين شكل الإشعار والسجلات
    const offerName = searchParams.get('offer_name') || 'PubScale Task';
    const goalName = searchParams.get('goal_name') || '';
    const payoutUsd = searchParams.get('payout_usd') || '0';

    // 1. التحقق من وجود المتغيرات الإلزامية
    if (!userId || !token || !valueRaw || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // تحويل النقاط لرقم صحيح لحساب التوقيع الرقمي (كما يطلب التوثيق بالضبط)
    const pointsToReward = Math.floor(parseFloat(valueRaw));

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid reward value' }, { status: 400 });
    }

    // 🔒 2. التحقق من التوقيع الرقمي (Hash Validation) لمنع الغش
    // الصيغة المطلوبة: secret_key.user_id.points.token
    const template = `${PUBSCALE_SECRET_KEY}.${userId}.${pointsToReward}.${token}`;
    const calculatedSignature = crypto.createHash('md5').update(template).digest('hex');

    if (signature.toLowerCase() !== calculatedSignature.toLowerCase()) {
      console.error('[PubScale] Signature Mismatch!');
      return NextResponse.json({ error: 'Invalid hash signature' }, { status: 401 });
    }

    // 3. التحقق من عدم تكرار العملية باستخدام الـ Token الفريد لمنع الثغرات
    const transactionId = `pubscale_${token}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 4. التحقق من وجود حسابك الفعلي أو التحويل التلقائي للتجربة
    let userRef = adminDb.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; // حسابك الشخصي للتست
      userRef = adminDb.collection('users').doc(userId);
    }

    // تنسيق اسم العرض مع المهمة الفرعية إن وجدت
    const displayGoal = goalName ? ` - ${goalName}` : '';
    const finalOfferTitle = `${offerName}${displayGoal}`;

    // 5. تشغيل العملية في قاعدة البيانات (شحن النقاط + سجلات + إشعار الجرس)
    await adminDb.runTransaction(async (ts) => {
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // حفظ المعاملة بالسجلات المالية للموقع
      ts.set(transactionRef, {
        userId,
        points: pointsToReward,
        payoutUsd: parseFloat(payoutUsd),
        offerName: finalOfferTitle,
        status: 'completed',
        type: 'pubscale_payout',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // إشعار جرس إنجليزي مرتب يظهر للمستخدم فوراً
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

    return NextResponse.json({ success: true, message: 'PubScale postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[PubScale Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
