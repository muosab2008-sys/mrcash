import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; // مدمج في Node.js لعمل تشفير SHA-256

// 🚨 توجه إلى Profile Settings في حسابك بـ GemiAd وانسخ الـ Secret Key وضعه هنا
const GEMIAD_SECRET_KEY = "ae81969a-e6a6-45ba-a443-b1e98aea62d7";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات المرسلة من سيرفر GemiAd
    let userId = searchParams.get('userId');            
    const offerId = searchParams.get('offerId');
    const offerName = searchParams.get('offerName') || 'GemiAd Offer';
    const eventId = searchParams.get('eventId') || '';
    const eventName = searchParams.get('eventName') || '';
    const payout = searchParams.get('payout') || '0';
    const reward = searchParams.get('reward'); // النقاط (تكون سالبة في حال الرفض)
    const txId = searchParams.get('txId'); // المعرف الفريد للمعاملة
    const status = searchParams.get('status'); // completed أو rejected
    const hash = searchParams.get('hash');

    // 1. التحقق من المتغيرات الإلزامية
    if (!hash || !userId || !offerId || !txId || !reward || !status) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // 🔒 2. التحقق من الهوية والتوقيع الرقمي (Hash Verification) لمنع الغش
    // المعادلة: SHA256(userId + offerId + txId + secretKey)
    const template = `${userId}${offerId}${txId}${GEMIAD_SECRET_KEY}`;
    const calculatedHash = crypto.createHash('sha256').update(template).digest('hex');

    if (hash !== calculatedHash) {
      console.error('[GemiAd] Invalid Hash Signature!');
      return new NextResponse('Unauthorized', { status: 400 });
    }

    // معرف المعاملة الفريد لحفظه في الفايربيس ومنع التكرار
    const transactionId = `gemiad_${txId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    const pointsAmount = parseFloat(reward);
    const displayOfferTitle = eventName ? `${offerName} - ${eventName}` : offerName;

    // 3. معالجة حالة الإضافة الناجحة (Conversion Completed)
    if (status === 'completed') {
      // التحقق من أن المعاملة لم تُشحن مسبقاً لحماية السيرفر من التكرار
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 }); // الرد بـ 200 لمنع إعادة المحاولة
      }

      // التحقق من وجود حسابك الفعلي أو التحويل التلقائي للتست
      let userRef = adminDb.collection('users').doc(userId);
      let userDoc = await userRef.get();

      if (!userDoc.exists) {
        userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; // حسابك الشخصي للتجربة
        userRef = adminDb.collection('users').doc(userId);
      }

      // تشغيل ترانزاكشن الفايربيس (إضافة نقاط + حفظ السجل + إشعار جرس)
      await adminDb.runTransaction(async (ts) => {
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(pointsAmount),
          totalEarned: admin.firestore.FieldValue.increment(pointsAmount)
        });

        ts.set(transactionRef, {
          userId,
          points: pointsAmount,
          payoutUsd: parseFloat(payout),
          offerName: displayOfferTitle,
          status: 'completed',
          type: 'gemiad_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId,
          title: 'Offerwall Reward',
          message: `You earned +${pointsAmount} points from GemiAd for completing "${displayOfferTitle}".`,
          type: 'earn',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return new NextResponse('Approved', { status: 200 });
    } 
    
    // 4. معالجة حالة الارتجاع والرفض (Reversal / Rejected)
    else if (status === 'rejected') {
      // إذا كانت المعاملة قد رفضت مسبقاً وتم خصمها، ننهي العملية بـ 200
      if (transactionDoc.exists && transactionDoc.data()?.status === 'reversed') {
        return new NextResponse('Approved', { status: 200 });
      }

      let userRef = adminDb.collection('users').doc(userId);
      let userDoc = await userRef.get();

      if (!userDoc.exists) {
        userId = "duO5FMkYkNTPUr9gi283LHoulOu2";
        userRef = adminDb.collection('users').doc(userId);
      }

      // حساب القيمة الموجبة للخصم (الـ reward قادم بالسالب من الشركة)
      const pointsToDeduct = Math.abs(pointsAmount);

      await adminDb.runTransaction(async (ts) => {
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(-pointsToDeduct) // خصم النقاط من رصيده الحالي
        });

        // تحديث حالة السجل المالي إلى reversed بدلاً من حذفه لمراقبة الغش
        ts.set(transactionRef, {
          status: 'reversed',
          reversedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // إرسال تنبيه أحمر للمستخدم يوضح له خصم النقاط بسبب الرفض
        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId,
          title: 'Reward Reversed',
          message: `-${pointsToDeduct} points were deducted because the offer "${displayOfferTitle}" was rejected by the advertiser.`,
          type: 'reversal',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return new NextResponse('Approved', { status: 200 });
    }

    return new NextResponse('Unknown status', { status: 400 });

  } catch (error: any) {
    console.error('[GemiAd Postback Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
