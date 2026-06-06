\import { NextRequest, NextResponse } from 'next/server';
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
    const userId = searchParams.get('user_id');            
    const offerName = searchParams.get('offer_name') || 'Adtowall Offer';
    const transactionId = searchParams.get('transaction_id');

    if (!userId || !pointsStr || !transactionId) {
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

    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      ts.update(userRef, {
        balance: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward),
        xp: admin.firestore.FieldValue.increment(pointsToReward)
      });

      ts.set(transactionRef, {
        userId,
        points: pointsToReward,
        payoutUsd: parseFloat(payoutUsd || '0'),
        offerName,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Points Earned!',
        message: `You earned +${pointsToReward} MC from completing ${offerName}`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, message: 'Postback processed and points awarded' }, { status: 200 });

  } catch (error: any) {
    console.error('[Adtowall Postback Error]:', error);
    if (error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
