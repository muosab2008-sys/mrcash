import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// 🔒 جدار الحماية المفتوح كلياً للـ IPs الخاصة بالشركة وجهازك 🔒
const KLINK_TRUSTED_IPS = [
  '34.118.33.53',    // Klink IP 1
  '138.68.125.171',  // Klink IP 2
  '64.226.93.56',    // Klink IP 3
  '31.167.153.187',  // الـ IP الشخصي الخاص بك (IPv4)
  '2a02:ce0:2004:3acf:99f6:c72:eb9b:31db' // الـ IP الشخصي الخاص بك (IPv6)
];

export async function POST(request: NextRequest) {
  return handleKlinkPostback(request, true);
}

export async function GET(request: NextRequest) {
  return handleKlinkPostback(request, false);
}

async function handleKlinkPostback(request: NextRequest, isPost: boolean) {
  try {
    // 1. استخراج الـ IP للتحقق الأمني وجدار الحماية
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

    if (clientIp) {
      if (!KLINK_TRUSTED_IPS.includes(clientIp)) {
        console.error(`❌ Klinklabs IP Blocked: ${clientIp}`);
        return NextResponse.json({ success: false, error: 'Unauthorized IP', ip: clientIp }, { status: 403 });
      }
    }

    // 2. الفرز الذكي والشامل لاستخراج البيانات من السيرفر أو المتصفح
    let payload: any = {};
    
    // جلب أي بيانات ممررة في الرابط (Query Params) أولاً كقاعدة أساسية
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    if (isPost) {
      try {
        const bodyData = await request.json();
        // دمج بيانات الـ Body مع الـ Query لضمان الإمساك بكل المتغيرات
        payload = { ...queryParams, ...bodyData };
      } catch (e) {
        payload = { ...queryParams };
      }
    } else {
      payload = { ...queryParams };
    }

    // 3. قراءة المعالم (بناءً على التوثيق الرسمي للحقول)
    let userId = payload.userId || payload.user_id;
    let conversionId = payload.conversionId || payload.conversion_id;
    let offerId = payload.offerId || payload.offer_id;
    let offerName = payload.offerName || payload.offer_name || 'Klink Test Offer';
    let eventType = payload.eventType || payload.event_type || 'conversion';
    let status = payload.status || 'completed';
    let payoutRaw = payload.payout;

    // 🎯 آلية الإنقاذ الذكي للوحة التحكم (إذا ضغطوا زر Test وكان المعرف وهمياً أو فارغاً)
    const isTestRequest = 
      !userId ||
      userId === "user-pub-001" || 
      userId === "pub-ext-user" || 
      userId === "kp-ex001-new" ||
      String(userId).toLowerCase().includes('test') ||
      String(conversionId).toLowerCase().includes('test');

    if (isTestRequest) {
      userId = "QpBIsti1UVOyrnkYvYVxemWupQy1"; // توجيه التيست القادم من الشركة لحسابك فوراً
      conversionId = conversionId || `klink_test_${Date.now()}`;
      offerId = offerId || 'test_offer_123';
    }

    // التحقق النهائي من المعالم قبل الدخول لقاعدة البيانات
    if (!conversionId || !offerId || payoutRaw === undefined || payoutRaw === null) {
      // إذا أرسلت اللوحة طلباً فارغاً كلياً للفحص، نقوم بتجهيزه ديناميكياً لكي لا يفشل الطلب في وجه الشركة
      payoutRaw = payoutRaw || "0";
    }

    let pointsToReward = parseFloat(payoutRaw);
    if (isNaN(pointsToReward)) {
      pointsToReward = 0;
    }

    // معالجة عمليات الارتجاع (Chargeback)
    const isChargeback = eventType === 'chargeback' || status === 'cancelled';
    if (isChargeback) {
      pointsToReward = -Math.abs(pointsToReward);
    }

    // منع تكرار العمليات الحية (أما عمليات الفحص فنتركها تمر لتشاهد الإشعار مراراً وتكراراً)
    const transactionId = `klinklabs_${conversionId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest && !isChargeback) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return NextResponse.json({ success: true, message: 'Processed (Duplicate)' }, { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();

    // 4. 🔥 تشغيل المعاملة الآمنة بداخل الفايربيس وشحن حقول الرصيد وجرس التنبيه بالإنجليزية 🔥
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
          email: "test_klinklabs@mrcash.app", 
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

      // تسجيل العملية في جدول الـ transactions
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: pointsToReward >= 0 ? 'offer_credit' : 'chargeback',
        offerId: offerId || 'test_id',
        offerName: `${offerName} (Klinklabs)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // 🇬🇧 كتابة صياغة التنبيه باللغة الإنجليزية بالكامل وتوجيهه لجرس تطبيق MrCash 🇬🇧
      ts.set(notificationRef, {
        userId: userId,
        title: pointsToReward >= 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: pointsToReward >= 0 
          ? `Your account has been credited with +${pointsToReward} points for completing: [ ${offerName} ] from Klinklabs.`
          : `Your account was deducted by ${Math.abs(pointsToReward)} points due to offer cancellation from Klinklabs.`,
        type: pointsToReward >= 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[Klinklabs Success] Handled ${pointsToReward} MC for user ${userId}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Klink_postback_processed_successfully_with_notification'
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Klinklabs Critical Postback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
