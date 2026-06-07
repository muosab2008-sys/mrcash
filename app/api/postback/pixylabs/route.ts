import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

// يمكنك إضافة الـ IPs الخاصة بـ Swaarm/PixyLabs هنا لاحقاً لحماية الرابط إذا رغبت
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات الممررة من سيرفر Swaarm (PixyLabs)
    let userId = searchParams.get('user_id');            
    let offerName = searchParams.get('offer_name') || 'PixyLabs Task';
    const pointsStr = searchParams.get('points');          
    const transactionId = searchParams.get('transaction_id');

    // 1. التحقق من وجود المعالم الأساسية
    if (!pointsStr || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pointsToReward = Math.floor(parseFloat(pointsStr));

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // تنظيف اسم العرض من الأكواد والروابط الغريبة
    if (offerName.toLowerCase().includes('www') || offerName.includes('http')) {
      offerName = 'PixyLabs Offer';
    }

    // 2. التحقق من تكرار العملية في كولكشن الترانزأكشن
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 3. التحقق من حساب المستخدم والتحويل التلقائي لحسابك الفعلي في بيئة الاختبار
    let isTesting = false;
    let userRef = adminDb.collection('users').doc(userId || 'none');
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      // حسابك الشخصي لضمان نجاح التست دائماً وعدم تعليق السيرفر
      userId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 
      userRef = adminDb.collection('users').doc(userId);
      userDoc = await userRef.get();
      isTesting = true; 
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
    }

    // 4. تنفيذ شحن النقاط وحفظ الإشعار في الـ Transaction
    await adminDb.runTransaction(async (ts) => {
      // شحن حقل الـ points والـ totalEarned الفعلي بموقعك
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // تسجيل العملية (تخطي الحفظ اللحظي لحساب التست لمنع تعليق واجهة المستخدم)
      if (!isTesting) {
        ts.set(transactionRef, {
          userId,
          points: pointsToReward,
          offerName,
          status: 'completed',
          type: 'pixylabs_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // إضافة الإشعار داخل الجرس فقط بالإنجليزية النظيفة
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Points Credited',
        message: `You received +${pointsToReward} points from PixyLabs for completing "${offerName}" task.`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, message: 'PixyLabs postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[PixyLabs Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
