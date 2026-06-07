import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; // مدمج في Node.js لعمل تشفير SHA-1

// 🚨 قم باستبدال هذه المفاتيح بالمفاتيح الحقيقية من لوحة تحكم Playtime SDK الخاصة بك
const APP_KEY = "YOUR_APPLICATION_KEY_HERE";
const SECRET_KEY = "YOUR_APPLICATION_SECRET_KEY_HERE";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات الممررة من Playtime SDK
    let userId = searchParams.get('user_id');            
    const offerId = searchParams.get('offer_id') || '';
    let offerName = searchParams.get('offer_name') || 'Playtime Game';
    const amountStr = searchParams.get('amount'); // عدد النقاط الفعلي للمستخدم
    const signature = searchParams.get('signature');
    const taskId = searchParams.get('task_id') || '';
    const taskName = searchParams.get('task_name') || '';

    if (!amountStr || !signature || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pointsToReward = parseInt(amountStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // 🔒 التحقق من التوقيع الرقمي لمنع الغش والتزوير (Signature Verification)
    // القاعدة: sha1(userId + offerId + pointsToReward + APP_KEY + SECRET_KEY)
    const rawString = `${userId}${offerId}${pointsToReward}${APP_KEY}${SECRET_KEY}`;
    const calculatedSignature = crypto.createHash('sha1').update(rawString).digest('hex');

    // إذا كان التوقيع غير متطابق، نرفض الطلب فوراً لحماية رصيد الموقع
    if (signature.toLowerCase() !== calculatedSignature.toLowerCase()) {
      console.error('[Playtime SDK] Signature Mismatch!');
      return NextResponse.json({ error: 'Invalid signature authentication' }, { status: 401 });
    }

    // نصنع معرف فريد للمعاملة مدمج بين العرض والمهمة لضمان عدم التكرار
    const uniqueTransactionId = `playtime_${offerId}_${taskId || 'default'}_${signature.slice(0, 8)}`;

    const transactionRef = adminDb.collection('transactions').doc(uniqueTransactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // التحقق من حساب المستخدم والتحويل التلقائي لحسابك في بيئة الاختبار
    let isTesting = false;
    let userRef = adminDb.collection('users').doc(userId);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      // حسابك الشخصي لنجاح التست التجريبي
      userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; 
      userRef = adminDb.collection('users').doc(userId);
      userDoc = await userRef.get();
      isTesting = true;
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // تنظيف اسم المهمة أو العرض ليكون احترافياً ومفهوماً في الجرس
    const displayTask = taskName ? ` - ${taskName}` : '';

    await adminDb.runTransaction(async (ts) => {
      // شحن حقل الرصيد الفعلي بموقعك
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // حفظ العملية بالسجلات
      if (!isTesting) {
        ts.set(transactionRef, {
          userId,
          points: pointsToReward,
          offerName: `${offerName}${displayTask}`,
          status: 'completed',
          type: 'playtime_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // إشعار الجرس بالإنجليزية النظيفة المتوافقة مع تحديثات موقعك
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Playtime Rewards',
        message: `You received +${pointsToReward} points for playing "${offerName}"${displayTask}.`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, message: 'Playtime postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Playtime SDK Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
