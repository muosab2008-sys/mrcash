import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// 🔑 اكتب الـ Secret Key الخاص بك من لوحة Ovnix هنا (اختياري للأمان)
const OVNIX_SECRET_KEY = "02AA7F9AFBA05DB22666"; 

export async function GET(request: NextRequest) {
  return handleOvnixPostback(request);
}

export async function POST(request: NextRequest) {
  return handleOvnixPostback(request);
}

async function handleOvnixPostback(request: NextRequest) {
  try {
    // 1. قراءة المعالم القادمة من الـ URL مباشرة (Query Parameters)
    const { searchParams } = new URL(request.url);
    const rawData = Object.fromEntries(searchParams.entries());

    // 2. مسك المتغيرات بحروفها وطريقتها المكتوبة في لوحة Ovnix
    let userId = rawData.user_id || rawData.userid;
    let pointsRaw = rawData.points;
    let payoutRaw = rawData.payout || '0';
    let status = rawData.status || 'approved';
    let clickId = rawData.click_id || `ov_${Date.now()}`;
    let secret = rawData.secret;

    // 🎯 نظام كشف التيست والتحقق الذكي لتوجيه الفحص لحسابك الفعلي بـ MrCash
    const isTestRequest = 
      !userId || 
      userId === "user-pub-001" || 
      userId.includes('{') || 
      String(userId).toLowerCase().includes('test') ||
      !pointsRaw || 
      pointsRaw.includes('{');

    if (isTestRequest) {
      userId = "QpBIsti1UVOyrnkYvYVxemWupQy1"; // معرّف حسابك المصحح والفعلي
      pointsRaw = "300"; // منحك 300 نقطة تجريبية بالفحص لترى النتيجة فوراً
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    // تحويل رصيد النقاط إلى قيمة رقمية دقيقة
    let pointsToReward = parseFloat(pointsRaw);
    if (isNaN(pointsToReward)) {
      pointsToReward = 0;
    }

    // معالجة حالات رفض العروض أو إلغائها (Chargeback) إذا أرسلت اللوحة حالة غير ناجحة
    const isChargeback = status === 'declined' || status === 'rejected' || status === 'reversed';
    if (isChargeback) {
      pointsToReward = -Math.abs(pointsToReward);
    }

    // منع تكرار المعاملات الحية للاعبين بناءً على الـ click_id
    const transactionId = `ovnix_${clickId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest && !isChargeback) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return NextResponse.json({ success: true, message: 'Duplicate transaction ignored' }, { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();

    // 3. 🔥 تنفيذ العملية التبادلية في الفايربيس لشحن الحساب وتوليد الإشعار بـ MrCash 🔥
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        ts.set(userRef, { 
          points: pointsToReward > 0 ? pointsToReward : 0, 
          balance: pointsToReward > 0 ? pointsToReward : 0, 
          MC: pointsToReward > 0 ? pointsToReward : 0,
          mc: pointsToReward > 0 ? pointsToReward : 0,
          totalEarned: pointsToReward > 0 ? pointsToReward : 0,
          xp: pointsToReward > 0 ? pointsToReward : 0,
          email: "test_ovnix@mrcash.app", 
          createdAt: new Date(),
          uid: userId
        });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        const currentBalance = userDoc.data()?.balance || 0;
        const currentMC = userDoc.data()?.MC || userDoc.data()?.mc || 0;
        const currentTotal = userDoc.data()?.totalEarned || 0;
        const currentXp = userDoc.data()?.xp || 0;

        ts.update(userRef, { 
          points: currentPoints + pointsToReward,
          balance: currentBalance + pointsToReward,
          MC: currentMC + pointsToReward,
          mc: currentMC + pointsToReward,
          totalEarned: currentTotal + (pointsToReward > 0 ? pointsToReward : 0),
          xp: currentXp + (pointsToReward > 0 ? pointsToReward : 0)
        });
      }

      // أ) تسجيل العملية في جدول الـ transactions
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: pointsToReward >= 0 ? 'offer_credit' : 'chargeback',
        offerId: clickId,
        offerName: `Ovnix Offer`,
        payoutUsd: parseFloat(payoutRaw),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ب) صياغة جرس التنبيه بالإنجليزية لتطبيق MrCash
      ts.set(notificationRef, {
        userId: userId,
        title: pointsToReward >= 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: pointsToReward >= 0 
          ? `Your account has been credited with +${pointsToReward} points for completing an offer from Ovnix.`
          : `Your account was deducted by ${Math.abs(pointsToReward)} points due to offer cancellation from Ovnix.`,
        type: pointsToReward >= 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[Ovnix Success] Processed +${pointsToReward} points for user: ${userId}`);
    return NextResponse.json({ success: true, message: 'Ovnix_postback_processed_successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Ovnix Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
