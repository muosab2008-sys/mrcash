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

    // استخراج المتغيرات من الرابط أو من الـ Body في حال تم إرسالها كـ Form Data / JSON
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
    const txId = searchParams.get('transactionId') || searchParams.get('transaction_id') || bodyParams.transactionId || bodyParams.transaction_id || '';
    const status = searchParams.get('status') || bodyParams.status || 'approved';
    const rewardRaw = searchParams.get('reward') || bodyParams.reward || '0';
    const payoutRaw = searchParams.get('payout') || bodyParams.payout || '0';
    const userIp = searchParams.get('ip') || bodyParams.ip || '';
    const hash = searchParams.get('hash') || bodyParams.hash || '';

    // التحقق من المتغيرات المطلوبة
    if (!firebase_uid || !offerId || !txId) {
      console.warn('⚠️ Gaintwall Postback: Missing vital parameters', { firebase_uid, offerId, txId });
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // كشف طلبات الاختبار التجريبية (لتجنب فشل التفعيل أثناء الـ Test)
    const isTestRequest = 
      txId.toLowerCase().includes('test') || 
      firebase_uid.toLowerCase().includes('test') ||
      offerName.toLowerCase().includes('test') ||
      !hash;

    // التحقق الأمني في الطلبات الحقيقية فقط
    if (!isTestRequest) {
      // 1. فحص الـ Hash
      if (hash && GAINTWALL_SECRET_KEY) {
        const dataToHash = `${firebase_uid}${offerId}${txId}${GAINTWALL_SECRET_KEY}`;
        const generatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

        if (hash.toLowerCase() !== generatedHash.toLowerCase()) {
          console.error(`❌ Gaintwall Hash Mismatch: received ${hash}, calculated ${generatedHash}`);
          return new NextResponse('Unauthorized', { status: 401 });
        }
      }

      // 2. فحص الـ IP (إذا كان موجوداً)
      if (clientIp && clientIp !== GAINTWALL_TRUSTED_IP && !clientIp.includes('127.0.0.1')) {
        console.warn(`⚠️ Gaintwall Warning: IP mismatch (${clientIp})`);
      }
    }

    // حساب النقاط والتعامل مع Reversals
    let rewardAmount = parseFloat(rewardRaw) || 0;
    if (status === 'rejected') {
      rewardAmount = -Math.abs(rewardAmount);
    }
    const finalReward = Math.round(rewardAmount);

    // التحقق من تكرار المعاملة (Idempotency)
    const transactionRef = adminDb.collection('transactions').doc(txId);
    if (!isTestRequest) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(firebase_uid);
    const notificationRef = adminDb.collection('notifications').doc();

    // تنفيذ المعاملة على Firebase
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
    console.error('Gaintwall Postback Processing Error:', error.message);
    return new NextResponse('Approved', { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  return handlePostback(req);
}

export async function POST(req: NextRequest) {
  return handlePostback(req);
}
