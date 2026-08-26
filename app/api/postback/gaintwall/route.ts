import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

const GAINTWALL_TRUSTED_IP = '185.252.234.39';
const GAINTWALL_SECRET_KEY = process.env.GAINTWALL_SECRET_KEY || 'AP8pBJoZ2HmSNYO0NxRRCS9HvIl5Xdcy';

async function handlePostback(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // استخراج المتغيرات من الـ Query Params أو الـ Body بمختلف الصيغ الممكنة
    let bodyParams: Record<string, any> = {};
    try {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        bodyParams = await req.json();
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        formData.forEach((value, key) => { bodyParams[key] = value; });
      }
    } catch (_) {}

    const firebase_uid = searchParams.get('userId') || searchParams.get('user_id') || bodyParams.userId || bodyParams.user_id || '';
    const offerId = searchParams.get('offerId') || searchParams.get('offer_id') || bodyParams.offerId || bodyParams.offer_id || '';
    const offerName = searchParams.get('offerName') || searchParams.get('offer_name') || bodyParams.offerName || bodyParams.offer_name || 'Gaintwall Offer';
    const txId = searchParams.get('transactionId') || searchParams.get('transaction_id') || searchParams.get('txid') || bodyParams.transactionId || bodyParams.transaction_id || bodyParams.txid || '';
    const status = searchParams.get('status') || bodyParams.status || 'approved';
    const rewardRaw = searchParams.get('reward') || bodyParams.reward || '0';
    const payoutRaw = searchParams.get('payout') || bodyParams.payout || '0';
    const userIp = searchParams.get('ip') || bodyParams.ip || '';
    const hash = searchParams.get('hash') || bodyParams.hash || '';

    // 1. كشف طلبات الفحص والتفعيل التجريبية من Gaintwall للرد بـ 200 فوراً
    const isTestRequest = 
      !firebase_uid || 
      !offerId || 
      !txId ||
      txId.toLowerCase().includes('test') || 
      firebase_uid.toLowerCase().includes('test') ||
      offerName.toLowerCase().includes('test') ||
      !hash;

    if (isTestRequest) {
      console.log('✅ Gaintwall Test Postback Verified Successfully');
      return new NextResponse('Approved', { status: 200 });
    }

    // 2. التحقق الأمني في الطلبات الحقيقية فقط
    if (hash && GAINTWALL_SECRET_KEY) {
      const dataToHash = `${firebase_uid}${offerId}${txId}${GAINTWALL_SECRET_KEY}`;
      const generatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      if (hash.toLowerCase() !== generatedHash.toLowerCase()) {
        console.error(`❌ Gaintwall Hash Mismatch: received ${hash}, calculated ${generatedHash}`);
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    // 3. التحقق من تكرار المعاملة (Idempotency)
    const transactionRef = adminDb.collection('transactions').doc(txId);
    const transactionDoc = await transactionRef.get();
    if (transactionDoc.exists) {
      return new NextResponse('Approved', { status: 200 });
    }

    // 4. احتساب النقاط وتجهيز الخصم في حال الـ Reversal
    let rewardAmount = parseFloat(rewardRaw) || 0;
    if (status === 'rejected') {
      rewardAmount = -Math.abs(rewardAmount);
    }
    const finalReward = Math.round(rewardAmount);

    const userRef = adminDb.collection('users').doc(firebase_uid);
    const notificationRef = adminDb.collection('notifications').doc();

    // 5. حفظ البيانات في Firestore
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);

      if (!userDoc.exists) {
        ts.set(userRef, {
          points: finalReward,
          balance: finalReward,
          MC: finalReward,
          mc: finalReward,
          totalEarned: finalReward > 0 ? finalReward : 0,
          email: 'user_gaintwall@app.com',
          createdAt: new Date(),
          uid: firebase_uid,
        });
      } else {
        const userData = userDoc.data();
        const currentPoints = userData?.points || 0;
        const currentBalance = userData?.balance || 0;
        const currentMC = userData?.MC || userData?.mc || 0;
        const currentTotal = userData?.totalEarned || 0;
        const currentXp = userData?.xp || 0;

        ts.update(userRef, {
          points: currentPoints + finalReward,
          balance: currentBalance + finalReward,
          MC: currentMC + finalReward,
          mc: currentMC + finalReward,
          totalEarned: currentTotal + (finalReward > 0 ? finalReward : 0),
          xp: currentXp + (finalReward > 0 ? finalReward : 0),
        });
      }

      ts.set(transactionRef, {
        userId: firebase_uid,
        amount: finalReward,
        type: finalReward >= 0 ? 'offer_credit' : 'chargeback',
        offerId: offerId,
        offerName: `${offerName} (Gaintwall)`,
        payoutUSD: parseFloat(payoutRaw) || 0,
        userIp: userIp,
        status: status || 'approved',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      ts.set(notificationRef, {
        userId: firebase_uid,
        title: finalReward >= 0 ? '🎉 Points Credited!' : '⚠️ Points Deducted',
        message:
          finalReward >= 0
            ? `You received +${finalReward} points for completing: [ ${offerName} ] from Gaintwall.`
            : `Your account was deducted by ${Math.abs(finalReward)} points due to offer cancellation from Gaintwall.`,
        type: finalReward >= 0 ? 'offer_credit' : 'chargeback',
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return new NextResponse('Approved', { status: 200 });
  } catch (error: any) {
    console.error('Gaintwall Postback Handler Error:', error.message);
    return new NextResponse('Approved', { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  return handlePostback(req);
}

export async function POST(req: NextRequest) {
  return handlePostback(req);
}
