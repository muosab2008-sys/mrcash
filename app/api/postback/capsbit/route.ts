import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const urlParams = new URL(req.url).searchParams;
    let bodyParams: any = {};

    try {
      const formData = await req.formData();
      formData.forEach((value, key) => { bodyParams[key] = value; });
    } catch (e) {
      try { bodyParams = await req.json(); } catch (jsError) { bodyParams = {}; }
    }

    // 1. استخراج المتغيرات الأساسية بناءً على توثيق Capsbit
    const firebase_uid = urlParams.get('uid') || bodyParams.uid || urlParams.get('user_id') || bodyParams.user_id;
    const txn_id = urlParams.get('txid') || bodyParams.txid || urlParams.get('transId') || bodyParams.transId;
    const payout = urlParams.get('payout') || bodyParams.payout || "0";
    const pointsRaw = urlParams.get('reward') || bodyParams.reward || urlParams.get('reward_value') || bodyParams.reward_value;
    const status = urlParams.get('status') || bodyParams.status || "approved";
    const offerId = urlParams.get('offer_id') || bodyParams.offer_id || "capsbit_id";
    const offerName = urlParams.get('offer_name') || bodyParams.offer_name || "Capsbit Offer";
    const sig = urlParams.get('sig') || bodyParams.sig;

    // التحقق من وجود المعرفات الأساسية للمستخدم والعملية
    if (!firebase_uid || !txn_id) {
      console.warn("⚠️ Capsbit Postback: Missing vital parameters (uid or txid).");
      return new NextResponse("ERROR: Missing Parameters", { status: 400 });
    }

    // حساب النقاط (وضع 6000 نقطة افتراضياً عند الاختبار المباشر)
    let finalReward = pointsRaw ? Math.floor(Number(pointsRaw)) : 6000;

    // تمييز طلبات الفحص التجريبية
    const isTestRequest = 
      txn_id.toLowerCase().includes('test') || 
      firebase_uid.toLowerCase().includes('test');

    // 2. التحقق من حالة العرض (شحن الرصيد فقط عند الموافقة)
    const isApproved = status.toLowerCase() === 'approved' || status === '1';
    if (!isApproved && !isTestRequest) {
      return new NextResponse("OK", { status: 200 }); // إرجاع OK لتأكيد الاستلام بدون شحن النقاط
    }

    // 3. فحص ومنع تكرار المعاملة (Deduplication)
    const transactionRef = adminDb.collection('transactions').doc(txn_id);
    if (!isTestRequest) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return new NextResponse("OK", { status: 200 }); // المعاملة مسجلة مسبقاً، لا يتم تكرار الشحن
      }
    }

    const userRef = adminDb.collection('users').doc(firebase_uid);
    const notificationRef = adminDb.collection('notifications').doc();

    // 4. تشغيل العملية التبادلية (Transaction) لشحن الرصيد في الفايربيس
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);

      if (!userDoc.exists) {
        // إنشاء بروفايل في حال كان الطلب من أداة الفحص بحساب جديد لتفادي الأخطاء
        ts.set(userRef, {
          points: finalReward,
          balance: finalReward,
          MC: finalReward,
          mc: finalReward,
          totalEarned: finalReward > 0 ? finalReward : 0,
          email: "test_capsbit@mrcash.app",
          createdAt: new Date(),
          uid: firebase_uid,
        });
      } else {
        const data = userDoc.data();
        const currentPoints = data?.points || 0;
        const currentBalance = data?.balance || 0;
        const currentMC = data?.MC || data?.mc || 0;
        const currentTotal = data?.totalEarned || 0;
        const currentXp = data?.xp || 0;

        // تحديث كافة حقول النقاط والخبرة فوراً
        ts.update(userRef, {
          points: currentPoints + finalReward,
          balance: currentBalance + finalReward,
          MC: currentMC + finalReward,
          mc: currentMC + finalReward,
          totalEarned: currentTotal + (finalReward > 0 ? finalReward : 0),
          xp: currentXp + (finalReward > 0 ? finalReward : 0),
        });
      }

      // أ) تسجيل المعاملة في جدول الفواتير
      ts.set(transactionRef, {
        userId: firebase_uid,
        amount: finalReward,
        payoutUSD: Number(payout) || 0,
        type: 'offer_credit',
        offerId: offerId,
        offerName: `${offerName} (Capsbit)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
      });

      // ب) إرسال إشعار للمستخدم
      ts.set(notificationRef, {
        userId: firebase_uid,
        title: "🎉 Points Credited!",
        message: `Your account has been credited with +${finalReward} points for completing: [ ${offerName} ] from Capsbit.`,
        type: "offer_credit",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    console.error("Capsbit Postback Critical Error:", error.message);
    return new NextResponse("OK", { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
