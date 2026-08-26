import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// الآي بي الرسمي المعتمد من Gaintwall
const GAINTWALL_TRUSTED_IP = '185.252.234.39';

// المفتاح السري الخاص بك لشبكة Gaintwall
const GAINTWALL_SECRET_KEY = process.env.GAINTWALL_SECRET_KEY || 'AP8pBJoZ2HmSNYO0NxRRCS9HvIl5Xdcy';

export async function GET(req: NextRequest) {
  try {
    // 1. استخراج الـ IP الخاص بالسيرفر المرسل
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

    const urlParams = new URL(req.url).searchParams;

    // 2. قراءة المتغيرات بناءً على Macros شبكة Gaintwall
    const firebase_uid = urlParams.get('userId');
    const offerId = urlParams.get('offerId');
    const offerName = urlParams.get('offerName') || 'Gaintwall Offer';
    const txId = urlParams.get('transactionId');
    const status = urlParams.get('status'); // "approved" أو "rejected"
    const rewardRaw = urlParams.get('reward');
    const payoutRaw = urlParams.get('payout');
    const userIp = urlParams.get('ip') || '';
    const hash = urlParams.get('hash');

    // التحقق من المتغيرات الإلزامية
    if (!firebase_uid || !offerId || !txId) {
      console.warn('⚠️ Gaintwall Postback: Missing vital parameters.');
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // كشف طلبات الفحص التجريبية (Test Postback)
    const isTestRequest =
      txId.toLowerCase().includes('test') ||
      firebase_uid.toLowerCase().includes('test') ||
      !hash;

    // 3. 🔒 التحقق الأمني من الـ IP والـ Hash في البيئة الحقيقية 🔒
    if (!isTestRequest) {
      // أ) فحص الآي بي
      if (clientIp && clientIp !== GAINTWALL_TRUSTED_IP) {
        console.error(`❌ Gaintwall Security Warning: Unauthorized IP: ${clientIp}`);
        return new NextResponse('Unauthorized IP', { status: 403 });
      }

      // ب) فحص الـ Hash حسب معادلة Gaintwall: SHA256(user_id + offer_id + transaction_id + secretKey)
      if (hash && GAINTWALL_SECRET_KEY) {
        const dataToHash = `${firebase_uid}${offerId}${txId}${GAINTWALL_SECRET_KEY}`;
        const generatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

        if (hash.toLowerCase() !== generatedHash.toLowerCase()) {
          console.error('❌ Gaintwall Security Warning: Hash mismatch.');
          return new NextResponse('Unauthorized', { status: 401 });
        }
      }
    }

    // 4. احتساب النقاط والتعامل مع حالات الارتجاع (Reversals)
    let rewardAmount = rewardRaw ? parseFloat(rewardRaw) : 0;
    
    if (status === 'rejected') {
      rewardAmount = -Math.abs(rewardAmount);
    }

    const finalReward = Math.round(rewardAmount);

    // 5. فحص ومنع تكرار المعاملات (Idempotency)
    const transactionRef = adminDb.collection('transactions').doc(txId);
    
    if (!isTestRequest) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(firebase_uid);
    const notificationRef = adminDb.collection('notifications').doc();

    // 6. 🔥 تنفيذ العملية عبر Firestore Transaction 🔥
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

      // أ) حفظ سجل المعاملة
      ts.set(transactionRef, {
        userId: firebase_uid,
        amount: finalReward,
        type: finalReward >= 0 ? 'offer_credit' : 'chargeback',
        offerId: offerId,
        offerName: `${offerName} (Gaintwall)`,
        payoutUSD: payoutRaw ? parseFloat(payoutRaw) : 0,
        userIp: userIp,
        status: status || 'approved',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ب) إرسال الإشعار
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
    console.error('Gaintwall Postback Critical Error:', error.message);
    return new NextResponse('Approved', { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
