import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

export const dynamic = 'force-dynamic';

// 🚨 تأكد من كتابة المفاتيح الخاصة بك في ملف الـ .env أو ضعها هنا مباشرة
const PLAYTIME_APP_KEY = process.env.PLAYTIME_APP_KEY || "YOUR_APPLICATION_KEY";
const PLAYTIME_SECRET_KEY = process.env.PLAYTIME_SECRET_KEY || "YOUR_APPLICATION_SECRET_KEY";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات بناءً على الجدول الموضح في توثيق Playtime SDK
    const rawUserId = searchParams.get('user_id'); 
    const offerId = searchParams.get('offer_id');
    const amountRaw = searchParams.get('amount'); 
    const signature = searchParams.get('signature');
    
    const offerName = searchParams.get('offer_name') || 'Playtime Task';
    const taskName = searchParams.get('task_name') || '';

    // التحقق من المعالم الأساسية المطلوبة في التوثيق
    if (!rawUserId || !offerId || !amountRaw || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // جلب القيمة الحقيقية بالفواصل من أجل الشحن الدقيق ومنع مشكلة النقطة الواحدة
    const pointsToReward = parseFloat(amountRaw);
    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid amount value' }, { status: 400 });
    }

    // كشف طلبات الفحص التجريبية لتسهيل تفعيل الرابط بداخل لوحة التحكم
    const isTestRequest = 
      rawUserId.toLowerCase().includes('test') || 
      offerId.toLowerCase().includes('test') || 
      signature.toLowerCase().includes('test') ||
      rawUserId === "123";

    // 🔒 1. التحقق الأمني من الـ Signature (SHA-1) بناءً على التوثيق 🔒
    if (!isTestRequest) {
      // نستخدم القيمة الحقيقية القادمة من السيرفر مباشرة لضمان مطابقة الهاش بنسبة 100% دون أخطاء تقريب
      const coinAmountInt = Math.floor(pointsToReward);
      const stringToHash = `${rawUserId}${offerId}${coinAmountInt}${PLAYTIME_APP_KEY}${PLAYTIME_SECRET_KEY}`;
      const calculatedSignature = crypto.createHash('sha1').update(stringToHash).digest('hex');

      if (signature.toLowerCase() !== calculatedSignature.toLowerCase()) {
        console.error(`❌ Playtime Security Warning: Signature Mismatch!`);
        return NextResponse.json({ error: 'Invalid signature hash' }, { status: 403 });
      }
    }

    // 2. تنظيف الـ userId للبحث عنه وتأمين حساب الفحص التجريبي
    let userId = rawUserId;
    if (userId.startsWith('TEST_')) {
      userId = userId.replace('TEST_', '');
    }
    if (userId === "123" || isTestRequest) {
      userId = "YjkvTqAkpMhpmj6ts19g6bvhBDx1"; // حسابك الشخصي المعتمد للتجربة
    }

    // 3. منع تكرار المعاملة (Deduplication) باستخدام الـ Signature كمُعرّف فريد
    const transactionId = `playtime_${signature.slice(0, 30)}`; 
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return NextResponse.json({ success: true, message: 'Transaction already processed' }, { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();

    const displayTask = taskName ? ` - ${taskName}` : '';
    const finalOfferTitle = `${offerName}${displayTask}`;

    // 4. 🔥 تشغيل العملية المترابطة الآمنة (Transaction) لتحديث كافة حقول الرصيد والجرس فوراً 🔥
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // إنشاء بروفايل تجريبي لحماية الـ API من السقوط أثناء الفحص الخارجي بـ User ID عشوائي
        ts.set(userRef, { 
          points: pointsToReward, 
          balance: pointsToReward, 
          MC: pointsToReward,
          mc: pointsToReward,
          totalEarned: pointsToReward,
          email: "test_playtime@mrcash.app", 
          createdAt: new Date(),
          uid: userId
        });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        const currentBalance = userDoc.data()?.balance || 0;
        const currentMC = userDoc.data()?.MC || userDoc.data()?.mc || 0;
        const currentTotal = userDoc.data()?.totalEarned || 0;
        const currentXp = userDoc.data()?.xp || 0;

        // شحن الحقول الصحيحة المعتمدة بالكامل وبقيمة النقاط الحقيقية بالفواصل الكاملة
        ts.update(userRef, { 
          points: currentPoints + pointsToReward,
          balance: currentBalance + pointsToReward,
          MC: currentMC + pointsToReward,
          mc: currentMC + pointsToReward,
          totalEarned: currentTotal + pointsToReward,
          xp: currentXp + pointsToReward
        });
      }

      // أ) تدوين حركة المال بجدول السجلات التاريخية للعمليات
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: 'offer_credit',
        offerId: offerId,
        offerName: `${finalOfferTitle} (Playtime)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ب) 🇬🇧 صياغة الإشعار اللحظي باللغة الإنجليزية النظيفة 100% لتشغيل الجرس والـ Toast 🇬🇧
      ts.set(notificationRef, {
        userId: userId,
        title: "🎉 Points Credited!",
        message: `Your account has been credited with +${pointsToReward} points for completing: [ ${finalOfferTitle} ] from Playtime.`,
        type: "offer_credit",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[Playtime Success] Credited +${pointsToReward} MC to user ${userId}`);
    return NextResponse.json({ success: true, message: 'Processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Playtime Postback Critical Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
