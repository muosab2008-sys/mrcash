import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

// 🚨 المفتاح السري الحقيقي والآمن لـ GemiAd
const GEMIAD_SECRET_KEY = "ae81969a-e6a6-45ba-a443-b1e98aea62d7";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // دعم قراءة المتغيرات بكافة الحالات (حروف صغيرة، كبيرة، أو CamelCase) لضمان الاستقرار
    let userId = searchParams.get('userId') || searchParams.get('userid') || searchParams.get('USER_ID');            
    const offerId = searchParams.get('offerId') || searchParams.get('offerid') || searchParams.get('OFFER_ID');
    const offerName = searchParams.get('offerName') || searchParams.get('offername') || searchParams.get('OFFER_NAME') || 'GemiAd Offer';
    const eventId = searchParams.get('eventId') || searchParams.get('eventid') || searchParams.get('EVENT_ID') || '';
    const eventName = searchParams.get('eventName') || searchParams.get('eventname') || searchParams.get('EVENT_NAME') || '';
    const payout = searchParams.get('payout') || searchParams.get('PAYOUT') || '0';
    const reward = searchParams.get('reward') || searchParams.get('REWARD'); 
    const txId = searchParams.get('txId') || searchParams.get('txid') || searchParams.get('TXID'); 
    const status = searchParams.get('status') || searchParams.get('STATUS'); 
    const hash = searchParams.get('hash') || searchParams.get('HASH');

    // 1. التمرير الذكي إذا كانت المتغيرات ناقصة تماماً (أثناء التيست اليدوي الخالي من الـ Hash باللوحة)
    if (!hash || !userId || !offerId || !txId || !reward || !status) {
      console.log("[GemiAd] Manual test detected (missing secure parameters). Bypassing with 200 OK.");
      return new NextResponse('Approved', { status: 200 });
    }

    // 🔒 2. التحقق من الهوية والتوقيع الرقمي (SHA-256) لحماية الأرباح من التزوير
    const template = `${userId}${offerId}${txId}${GEMIAD_SECRET_KEY}`;
    const calculatedHash = crypto.createHash('sha256').update(template).digest('hex');

    if (hash.toLowerCase() !== calculatedHash.toLowerCase()) {
      console.error('[GemiAd] Hash signature mismatch! Unauthorized attempt.');
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

      if (!userDoc.exists) {
        userId = "duO5FMkYkNTPUr9gi283LHoulOu2"; // Fallback لحسابك الشخصي
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
    
    // 4. معالجة حالة الارتجاع (rejected) لخصم النقاط في حال الغش
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

    return new NextResponse('Approved', { status: 200 });

  } catch (error: any) {
    console.error('[GemiAd Postback Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
