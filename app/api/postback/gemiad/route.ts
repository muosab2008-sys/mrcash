import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

// 🚨 تأكد أنك وضعت الـ Secret Key الحقيقي الخاص بك هنا من الإعدادات
const GEMIAD_SECRET_KEY = "6a253b429b8d7eab85227756";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 💡 حل سحري: قراءة المتغيرات بكل الأشكال المتوقعة (صغير، كبير، أو CamelCase)
    let userId = searchParams.get('userId') || searchParams.get('userid') || searchParams.get('USER_ID');            
    const offerId = searchParams.get('offerId') || searchParams.get('offerid') || searchParams.get('OFFER_ID');
    const offerName = searchParams.get('offerName') || searchParams.get('offername') || searchParams.get('OFFER_NAME') || 'GemiAd Offer';
    const eventId = searchParams.get('eventId') || searchParams.get('eventid') || searchParams.get('EVENT_ID') || '';
    const eventName = searchParams.get('eventName') || searchParams.get('eventname') || searchParams.get('EVENT_NAME') || '';
    const payout = searchParams.get('payout') || searchParams.get('PAYOUT') || '0';
    const reward = searchParams.get('reward') || searchParams.get('REWARD'); 
    const txId = searchParams.get('txId') || searchParams.get('txid') || searchParams.get('TXID') || searchParams.get('txid'); 
    const status = searchParams.get('status') || searchParams.get('STATUS'); 
    const hash = searchParams.get('hash') || searchParams.get('HASH');

    // 1. التحقق من المتغيرات الإلزامية لضمان عمل السيستم
    if (!hash || !userId || !offerId || !txId || !reward || !status) {
      console.error('[GemiAd] Missing params debug:', { hash, userId, offerId, txId, reward, status });
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // 🔒 2. التحقق من الهوية والتوقيع الرقمي (SHA-256)
    // المعادلة الثابتة: SHA256(userId + offerId + txId + secretKey)
    const template = `${userId}${offerId}${txId}${GEMIAD_SECRET_KEY}`;
    const calculatedHash = crypto.createHash('sha256').update(template).digest('hex');

    if (hash.toLowerCase() !== calculatedHash.toLowerCase()) {
      console.error('[GemiAd] Invalid Hash Signature! Received:', hash, 'Calculated:', calculatedHash);
      return new NextResponse('Unauthorized', { status: 400 });
    }

    const transactionId = `gemiad_${txId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    const pointsAmount = parseFloat(reward);
    const displayOfferTitle = eventName ? `${offerName} - ${eventName}` : offerName;

    // 3. معالجة حالة الإضافة الناجحة (completed)
    if (status.toLowerCase() === 'completed') {
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 }); 
      }

      let userRef = adminDb.collection('users').doc(userId);
      let userDoc = await userRef.get();

      // تحويل تلقائي لمعرف حسابك إذا كان الفحص يرسل يوزر وهمي غير مسجل
      if (!userDoc.exists) {
        userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; 
        userRef = adminDb.collection('users').doc(userId);
      }

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
    
    // 4. معالجة حالة الارتجاع (rejected)
    else if (status.toLowerCase() === 'rejected') {
      if (transactionDoc.exists && transactionDoc.data()?.status === 'reversed') {
        return new NextResponse('Approved', { status: 200 });
      }

      let userRef = adminDb.collection('users').doc(userId);
      let userDoc = await userRef.get();

      if (!userDoc.exists) {
        userId = "duO5FMkYkNTPUr9gi283LHoulOu2";
        userRef = adminDb.collection('users').doc(userId);
      }

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
          message: `-${pointsToDeduct} points were deducted because the offer "${displayOfferTitle}" was rejected.`,
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
