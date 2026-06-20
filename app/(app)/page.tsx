import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleAdBreakPostback(request);
}

export async function POST(request: NextRequest) {
  return handleAdBreakPostback(request);
}

async function handleAdBreakPostback(request: NextRequest) {
  try {
    // 1. جلب المعالم القادمة من الرابط (Query Parameters)
    const { searchParams } = new URL(request.url);
    const rawData = Object.fromEntries(searchParams.entries());

    console.log("📥 AdBreak Media Incoming Data:", rawData);

    // 2. مسك متغيرات AdBreak Media الرسمية المذكورة في التوثيق
    let userId = rawData.user;
    let rewardValueRaw = rawData.reward || rawData.coins;
    let offerName = rawData.offerName || 'AdBreak Offer';
    let offerId = rawData.offerId || '';
    let statusParam = rawData.status || 'completed'; 
    let txid = rawData.transaction_id || `ab_${Date.now()}`;
    let payoutRaw = rawData.payout || '0';
    let receivedHash = rawData.hash || '';

    // 🎯 نظام ذكي: إذا كانت اللوحة ترسل الماكرو فارغاً أو قيم تجريبية، يتم الشحن لحسابك الشخصي
    const isTestRequest = 
      !userId || 
      userId === "abc123&coins=999" ||
      userId === "abc123" || 
      userId === "123GnL" || 
      userId === "[YOUR_USER_ID]" ||
      userId.includes('{') || 
      userId.includes('[') ||
      String(userId).toLowerCase().includes('test');

    if (isTestRequest) {
      userId = "QpBIsti1UVOyrnkYvYVxemWupQy1"; // حسابك الفعلي لتجربة الفحص بأمان
    }

    // التحقق النهائي للتأكد من وجود معرف مستخدم (لأي شخص)
    if (!userId) {
      return NextResponse.json({ error: 'Missing user parameter' }, { status: 400 });
    }

    // 🔒 التحقق من الـ Hash للحماية (اختياري: يشتغل فقط في العمليات الحية التي تحتوي على Hash)
    // ⚠️ ضع مفتاحك السري (Secret Key) القادم من لوحة تحكم AdBreak بين القوسين بالأسفل
    const SECRET_KEY = "ضع_هنا_الـ_SECRET_KEY_الخاص_بك"; 
    
    if (receivedHash && SECRET_KEY && SECRET_KEY !== "ضع_هنا_الـ_SECRET_KEY_الخاص_بك" && !isTestRequest) {
      const dataToHash = `${userId}${offerId}${txid}${SECRET_KEY}`;
      const calculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
      
      if (receivedHash !== calculatedHash) {
        console.error("❌ AdBreak Security Error: Hash mismatch!");
        return NextResponse.json({ error: 'Unauthorized Hash' }, { status: 400 });
      }
    }

    // قراءة النقاط الممررة من اللوحة مباشرة (التي يختارها الآدمين أو تحسبها الشبكة)
    let pointsToReward = parseFloat(rewardValueRaw || '0');
    if (isNaN(pointsToReward)) {
      pointsToReward = 0;
    }

    // إذا كانت الحالة rejected أو تم إلغاء العرض، يتم تحويل النقاط لقيمة سالبة لخصمها
    const isRejected = statusParam.toLowerCase() === 'rejected';
    if (isRejected) {
      pointsToReward = -Math.abs(pointsToReward);
    }

    // حماية السيرفر ومنع تكرار المعاملات للاعبين (أما الفحص التجريبي فيمر للمعاينة دائماً)
    const transactionId = `adbreak_${txid}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest && !isRejected) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        // تطلب الشركة رداً ناجحاً دائماً حتى في التكرار لتفادي رسائل الفشل الإيميلية
        return NextResponse.json({ success: true, message: 'Duplicate transaction ignored' }, { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();

    // 3. 🔥 تشغيل العملية في الفايربيس لشحن حساب المستخدم الحالي فوراً 🔥
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
          email: "user_adbreak@mrcash.app", 
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

      // أ) تسجيل الفاتورة بجدول الـ transactions للمستخدم الحالي
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: pointsToReward >= 0 ? 'offer_credit' : 'chargeback',
        offerId: txid,
        offerName: `${offerName} (AdBreak Media)`,
        payoutUsd: parseFloat(payoutRaw),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // b) صياغة التنبيه وعرض القيمة داخل جرس تنبيهات حساب المستخدم الحالي
      ts.set(notificationRef, {
        userId: userId,
        title: pointsToReward >= 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: pointsToReward >= 0 
          ? `Your account has been credited with +${pointsToReward} points for completing: [ ${offerName} ] from AdBreak Media.`
          : `Your account was deducted by ${Math.abs(pointsToReward)} points due to offer cancellation from AdBreak Media.`,
        type: pointsToReward >= 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[AdBreak Success] Processed +${pointsToReward} points for user: ${userId}`);
    // تطلب الشركة نصاً صريحاً لا يحتوي على كلمة error، هذا الرد مثالي جداً ومقبول لديهم
    return NextResponse.json({ success: true, message: 'AdBreak_postback_processed_successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('❌ AdBreak Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
