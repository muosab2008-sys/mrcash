import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// 🔒 جدار الحماية: الـ IPs الرسمية لشركة Klink والـ IP الخاص بجهازك للتجربة في المتصفح
const KLINK_TRUSTED_IPS = [
  '34.118.33.53',    // Klink IP 1
  '138.68.125.171',  // Klink IP 2
  '64.226.93.56',    // Klink IP 3
  '2a02:ce0:2004:3acf:99f6:c72:eb9b:31db' // 🎯 الـ IP الشخصي الخاص بك للتجربة المباشرة
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
        console.error(`❌ Klinklabs Security Warning: Unauthorized IP blocked: ${clientIp}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized IP address', 
          yourIpAddress: clientIp 
        }, { status: 403 });
      }
    }

    let payload: any = {};

    // 2. قراءة المتغيرات ديناميكياً سواء أرسلتها اللوحة كـ POST JSON أو GET Query
    if (isPost) {
      try {
        payload = await request.json();
      } catch (e) {
        const { searchParams } = new URL(request.url);
        payload = Object.fromEntries(searchParams.entries());
      }
    } else {
      const { searchParams } = new URL(request.url);
      payload = Object.fromEntries(searchParams.entries());
    }

    // 3. مسك المتغيرات المتحركة طبقاً لتوثيق Klink الرسمي بالملي
    let userId = payload.userId;
    const conversionId = payload.conversionId;
    const offerId = payload.offerId;
    const offerName = payload.offerName || 'Klink Offer';
    const eventType = payload.eventType || 'conversion'; // conversion أو chargeback
    const status = payload.status || 'completed';         // completed أو cancelled
    const payoutRaw = payload.payout;                     // القيمة المالية الممررة

    // التحقق من المعالم الأساسية الفريدة للمهمة
    if (!conversionId || !offerId || payoutRaw === undefined || payoutRaw === null) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // تحويل الأرباح إلى قيمة رقمية دقيقة بالفواصل
    let pointsToReward = parseFloat(payoutRaw);
    if (isNaN(pointsToReward)) {
      return NextResponse.json({ error: 'Invalid payout value' }, { status: 400 });
    }

    // 4. كشف حالات التيست (Test Mode) الموضحة في توثيقهم للتحويلات الوهمية
    const isTestRequest = 
      conversionId.toLowerCase().includes('test') || 
      userId?.toLowerCase().includes('test') || 
      userId === "user-pub-001" || 
      userId === "pub-ext-user" || 
      userId === "kp-ex001-new" ||
      !userId;

    // 🎯 توجيه حساب التيست تلقائياً لمعرّف حسابك الشخصي الحقيقي لكي ترى النتيجة فوراً بـ MrCash
    if (isTestRequest) {
      userId = "QpBIsti1UVOyrnkYvYVxemWupQy1"; 
    }

    // 5. معالجة الارتجاع والخصم (Chargeback) إذا كانت القيمة سالبة أو الحالة cancelled
    const isChargeback = eventType === 'chargeback' || status === 'cancelled';
    if (isChargeback) {
      pointsToReward = -Math.abs(pointsToReward);
    }

    // 6. منع تكرار العمليات للحفاظ على أمان السيرفر (إلا في التيست نتركه يمر لتجربته بالمتصفح دائماً)
    const transactionId = `klinklabs_${conversionId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest && !isChargeback) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return NextResponse.json({ success: true, message: 'Transaction already processed' }, { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();

    // 7. 🔥 تشغيل العملية التبادلية الشاملة بداخل الفايربيس (Firestore Transaction) 🔥
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // إنشاء بروفايل تلقائي لحماية الـ API من الانهيار إذا أرسل التيست مستخدم وهمي
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

        // تحديث كافة حقول العملات والـ XP (سيعمل بنجاح ويقبل حتى الـ 0 للتيست)
        ts.update(userRef, { 
          points: currentPoints + pointsToReward,
          balance: currentBalance + pointsToReward,
          MC: currentMC + pointsToReward,
          mc: currentMC + pointsToReward,
          totalEarned: currentTotal + (pointsToReward > 0 ? pointsToReward : 0),
          xp: currentXp + (pointsToReward > 0 ? pointsToReward : 0)
        });
      }

      // أ) حفظ المعاملة في جدول الـ transactions للشفافية
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: pointsToReward >= 0 ? 'offer_credit' : 'chargeback',
        offerId: offerId,
        offerName: `${offerName} (Klinklabs)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ب) 🇬🇧 صياغة الإشعار اللحظي باللغة الإنجليزية النظيفة متضمناً اسم العرض والنقاط المتحركة 🇬🇧
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
      message: 'Klink_postback_processed_successfully_with_notification',
      clientIpAddress: clientIp
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Klinklabs Postback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
