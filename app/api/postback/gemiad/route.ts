import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

// المفتاح السري الحقيقي والآمن لـ GemiAd
const GEMIAD_SECRET_KEY = "ae81969a-e6a6-45ba-a443-b1e98aea62d7";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المتغيرات من الرابط لضمان قراءتها بكل المسميات المتوقعة
    let userId = searchParams.get('userId') || searchParams.get('userid') || searchParams.get('USER_ID');            
    const offerId = searchParams.get('offerId') || searchParams.get('offerid') || searchParams.get('OFFER_ID');
    const offerName = searchParams.get('offerName') || searchParams.get('offername') || searchParams.get('OFFER_NAME') || 'GemiAd Offer';
    const payout = searchParams.get('payout') || searchParams.get('PAYOUT') || '0';
    const reward = searchParams.get('reward') || searchParams.get('REWARD'); 
    const txId = searchParams.get('txId') || searchParams.get('txid') || searchParams.get('TXID'); 
    const status = searchParams.get('status') || searchParams.get('STATUS'); 
    const hash = searchParams.get('hash') || searchParams.get('HASH');

    // 1. تمرير الفحص التلقائي اليدوي للوحة إذا كانت القيم ناقصة
    if (!hash || !userId || !offerId || !txId || !reward || !status) {
      console.log("[GemiAd] Test/Manual Request detected. Bypassing with 200 OK.");
      return new NextResponse('Approved', { status: 200 });
    }

    // 🔒 2. جدار الحماية والأمان (SHA-256)
    // ميزة مصعب: إذا مررت كلمة 'mosab_admin' كـ hash، سيتخطى الأمان ويشحن لحسابك مباشرة!
    if (hash === 'mosab_admin') {
      console.log("[GemiAd] Master Key bypass used by Admin Mosab!");
      userId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; // فرض شحن حسابك الحقيقي المكتشف في الـ Firestore
    } else {
      // التحقق الفعلي للطلبات الحقيقية القادمة من السيرفر
      const template = `${userId}${offerId}${txId}${GEMIAD_SECRET_KEY}`;
      const calculatedHash = crypto.createHash('sha256').update(template).digest('hex');

      if (hash.toLowerCase() !== calculatedHash.toLowerCase()) {
        console.error('[GemiAd] Hash signature mismatch! Unauthorized attempt.');
        return new NextResponse('Unauthorized', { status: 400 });
      }
    }

    // 3. التحقق من عدم تكرار المعاملة لحماية نقاطك
    const transactionId = `gemiad_${txId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    const pointsAmount = parseFloat(reward);

    // 4. معالجة حالة الإضافة الناجحة (completed)
    if (status.toLowerCase() === 'completed') {
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 }); 
      }

      // مرجع مستند المستخدم الحقيقي في كولكشن users
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.error(`[GemiAd] User with ID ${userId} does not exist in Firestore.`);
        return new NextResponse('User Not Found', { status: 404 });
      }

      // تشغيل ترانزاكشن آمن لتعديل النقاط بالتزامن
      await adminDb.runTransaction(async (ts) => {
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(pointsAmount),
          totalEarned: admin.firestore.FieldValue.increment(pointsAmount)
        });

        // حفظ المعاملة في كولكشن transactions
        ts.set(transactionRef, {
          userId,
          points: pointsAmount,
          payoutUsd: parseFloat(payout),
          offerName: offerName,
          status: 'completed',
          type: 'gemiad_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // إرسال الإشعار في كولكشن notifications ليظهر في الجرس
        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId,
          title: 'Offerwall Reward',
          message: `You earned +${pointsAmount} MC from GemiAd for completing "${offerName}".`,
          type: 'earn',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return new NextResponse('Approved', { status: 200 });
    } 
    
    // 5. معالجة حالة الارتجاع والخصم (rejected) لطلب غش أو إلغاء العرض
    else if (status.toLowerCase() === 'rejected') {
      if (transactionDoc.exists && transactionDoc.data()?.status === 'reversed') {
        return new NextResponse('Approved', { status: 200 });
      }

      const userRef = adminDb.collection('users').doc(userId);
      const pointsToDeduct = Math.abs(pointsAmount);

      await adminDb.runTransaction(async (ts) => {
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(-pointsToDeduct)
        });

        ts.set(transactionRef, {
          status: 'reversed',
          reversedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId,
          title: 'Reward Reversed',
          message: `-${pointsToDeduct} MC were deducted because the offer "${offerName}" was rejected.`,
          type: 'reversal',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return new NextResponse('Approved', { status: 200 });
    }

    return new NextResponse('Approved', { status: 200 });

  } catch (error: any) {
    console.error('[GemiAd Postback Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
