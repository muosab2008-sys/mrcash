import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// 🔒 قائمة الـ IPs الرسمية والموثقة لـ Klink لحماية السيرفر من التزوير 🔒
const KLINK_TRUSTED_IPS = ['34.118.33.53', '138.68.125.171', '64.226.93.56'];

export async function POST(request: NextRequest) {
  return handleKlinkPostback(request, true);
}

export async function GET(request: NextRequest) {
  return handleKlinkPostback(request, false);
}

async function handleKlinkPostback(request: NextRequest, isPost: boolean) {
  try {
    // 1. نظام جدار الحماية للتحقق من الـ IP الموثق
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '';

    let payload: any = {};

    // استخراج البيانات بذكاء حسب نوع الطلب القادم (POST JSON أو GET Query)
    if (isPost) {
      payload = await request.json();
    } else {
      const { searchParams } = new URL(request.url);
      payload = Object.fromEntries(searchParams.entries());
    }

    // جلب المتغيرات الموضحة في جدول Payload Field Reference بالتوثيق
    let userId = payload.userId;
    const conversionId = payload.conversionId;
    const offerId = payload.offerId;
    const offerName = payload.offerName || 'Klink Offer';
    const eventType = payload.eventType || 'conversion'; // conversion أو chargeback
    const status = payload.status || 'completed'; // completed أو cancelled
    const payoutRaw = payload.payout; // قيمة الأرباح الممررة من اللوحة

    // التحقق من المعالم الأساسية الفريدة للمعاملة
    if (!conversionId || !offerId || !payoutRaw) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // تحويل الأرباح إلى قيمة رقمية حقيقية بالفواصل الكاملة والعدل دون نقصان
    let pointsToReward = parseFloat(payoutRaw);

    if (isNaN(pointsToReward)) {
      return NextResponse.json({ error: 'Invalid payout value' }, { status: 400 });
    }

    // كشف طلبات الفحص التجريبية لتسهيل تفعيل الرابط بداخل لوحتهم
    const isTestRequest = 
      conversionId.toLowerCase().includes('test') || 
      userId?.toLowerCase().includes('test') || 
      userId === "user-pub-001" || 
      userId === "pub-ext-user" || 
      userId === "kp-ex001-new" ||
      !userId;

    // 🔒 التحقق الأمني من الـ IP في البيئة الحقيقية 🔒
    if (!isTestRequest && clientIp) {
      if (!KLINK_TRUSTED_IPS.includes(clientIp)) {
        console.error(`❌ Klink Security Warning: Unauthorized IP blocked: ${clientIp}`);
        return NextResponse.json({ error: 'Unauthorized IP address' }, { status: 403 });
      }
    }

    // 2. تفعيل معالجة الارتجاع والخصم (Chargeback) إذا تم إلغاء العرض من قبلهم
    const isChargeback = eventType === 'chargeback' || status === 'cancelled' || pointsToReward < 0;
    if (isChargeback) {
      pointsToReward = -Math.abs(pointsToReward); // تحويل القيمة لسالب ليتم الخصم العادل
    }

    // 3. منع تكرار المعاملة للتحويلات العادية (أما الارتجاع فيسمح بتمريره لتحديث الرصيد بسالب)
    const transactionId = `klink_${conversionId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest && !isChargeback) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return NextResponse.json({ success: true, message: 'Transaction already processed' }, { status: 200 });
      }
    }

    // تأمين حساب تجريبي للاختبار إذا تم إرسال الطلب من أداة الفحص بمعرف افتراضي
    if (isTestRequest) {
      userId = "YjkvTqAkpMhpmj6ts19g6bvhBDx1"; // حسابك الشخصي المعتمد للتجربة والشحن
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();

    // 4. 🔥 تشغيل العملية التبادلية الشاملة (Firestore Transaction) لتحديث الرصيد والإشعارات فوراً 🔥
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // إنشاء بروفايل تجريبي لحماية الـ API من السقوط أثناء الفحص الخارجي بمعرف وهمي
        ts.set(userRef, { 
          points: pointsToReward > 0 ? pointsToReward : 0, 
          balance: pointsToReward > 0 ? pointsToReward : 0, 
          MC: pointsToReward > 0 ? pointsToReward : 0,
          mc: pointsToReward > 0 ? pointsToReward : 0,
          totalEarned: pointsToReward > 0 ? pointsToReward : 0,
          email: "test_klink@mrcash.app", 
          createdAt: new Date(),
          uid: userId
        });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        const currentBalance = userDoc.data()?.balance || 0;
        const currentMC = userDoc.data()?.MC || userDoc.data()?.mc || 0;
        const currentTotal = userDoc.data()?.totalEarned || 0;
        const currentXp = userDoc.data()?.xp || 0;

        // شحن الحساب الحقيقي بقيمة الفواصل الدقيقة الكاملة أو الخصم في حالة الارتجاع
        ts.update(userRef, { 
          points: currentPoints + pointsToReward,
          balance: currentBalance + pointsToReward,
          MC: currentMC + pointsToReward,
          mc: currentMC + pointsToReward,
          totalEarned: currentTotal + (pointsToReward > 0 ? pointsToReward : 0),
          xp: currentXp + (pointsToReward > 0 ? pointsToReward : 0)
        });
      }

      // أ) تدوين حركة المال بجدول السجلات التاريخية للعمليات (transactions)
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: pointsToReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: offerId,
        offerName: `${offerName} (Klink)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // b) 🇬🇧 كتابة صياغة الإشعار اللحظي باللغة الإنجليزية النظيفة 100% لتشغيل الجرس والـ Toast 🇬🇧
      ts.set(notificationRef, {
        userId: userId,
        title: pointsToReward > 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: pointsToReward > 0 
          ? `Your account has been credited with +${pointsToReward} points for completing: [ ${offerName} ] from Klink.`
          : `Your account was deducted by ${Math.abs(pointsToReward)} points due to offer cancellation from Klink.`,
        type: pointsToReward > 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[Klink Success] Managed +${pointsToReward} MC for user ${userId}`);
    return NextResponse.json({ success: true, message: 'Klink postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Klink Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
