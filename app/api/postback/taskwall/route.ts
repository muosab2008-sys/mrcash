import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleTaskWallPostback(request);
}

export async function POST(request: NextRequest) {
  return handleTaskWallPostback(request);
}

async function handleTaskWallPostback(request: NextRequest) {
  try {
    // 1. قراءة البيانات القادمة من رابط الـ URL مباشرة (Query Parameters)
    const { searchParams } = new URL(request.url);
    const rawData = Object.fromEntries(searchParams.entries());

    // 2. مسك المتغيرات بحروفها الصغيرة طبقاً لتوثيق TaskWall الرسمي بالملي
    let userId = rawData.userid;
    let userAmountRaw = rawData.user_amount;
    let offerName = rawData.offer_name || 'TaskWall Offer';
    let offerId = rawData.offer_id || 'taskwall_id';
    let payoutRaw = rawData.payout || '0';
    let dateParam = rawData.date || `tw_${Date.now()}`;

    // 3. 🎯 نظام كشف الفحص والتست لتوجيه الإشعار لحسابك الفعلي بـ MrCash
    const isTestRequest = 
      !userId || 
      userId === "user-pub-001" || 
      userId.includes('{') || 
      String(userId).toLowerCase().includes('test');

    if (isTestRequest) {
      userId = "QpBIsti1UVOyrnkYvYVxemWupQy1"; // حسابك الشخصي للتجربة الحية
      userAmountRaw = userAmountRaw && !userAmountRaw.includes('{') ? userAmountRaw : "120"; // شحن 120 نقطة تجريبية
      offerName = offerName && !offerName.includes('{') ? offerName : "TaskWall Reward Test";
    }

    if (!userId || userAmountRaw === undefined || userAmountRaw === null) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // تحويل رصيد العملة إلى قيمة رقمية
    let pointsToReward = parseFloat(userAmountRaw);
    if (isNaN(pointsToReward)) {
      pointsToReward = 0;
    }

    // منع تكرار المعاملات الحية للاعبين (أما التست فيمر دائماً لتطمئن)
    const transactionId = `taskwall_${userId}_${dateParam}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return NextResponse.json({ success: true, message: 'Duplicate transaction ignored' }, { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();

    // 4. 🔥 تشغيل العملية التبادلية في الفايربيس وشحن حقول العملة والتنبيه بالإنجليزية 🔥
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
          email: "test_taskwall@mrcash.app", 
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

      // أ) تدوين الفاتورة بجدول العمليات للمراجعة
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: 'offer_credit',
        offerId: offerId,
        offerName: `${offerName} (TaskWall)`,
        payoutUsd: parseFloat(payoutRaw),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ب) صياغة جرس التنبيه باللغة الإنجليزية بالكامل داخل التطبيق
      ts.set(notificationRef, {
        userId: userId,
        title: "🎉 Points Credited!",
        message: `Your account has been credited with +${pointsToReward} points for completing: [ ${offerName} ] from TaskWall.`,
        type: "offer_credit",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[TaskWall Success] Processed +${pointsToReward} points for user: ${userId}`);
    return NextResponse.json({ success: true, message: 'TaskWall_postback_processed_successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('❌ TaskWall Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
