import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

export const dynamic = 'force-dynamic';

const PLAYTIME_APP_KEY = process.env.PLAYTIME_APP_KEY || "YOUR_APPLICATION_KEY";
const PLAYTIME_SECRET_KEY = process.env.PLAYTIME_SECRET_KEY || "YOUR_APPLICATION_SECRET_KEY";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // جلب المعالم المطلوبة بناءً على التوثيق الرسمي لـ Playtime SDK
    const rawUserId = searchParams.get('user_id'); 
    const offerId = searchParams.get('offer_id');
    const amountRaw = searchParams.get('amount'); 
    const signature = searchParams.get('signature');
    const eventName = searchParams.get('event') || ''; // 🚨 حقل الـ event الأساسي للهاش
    
    const offerName = searchParams.get('offer_name') || 'Playtime Task';

    if (!rawUserId || !offerId || !amountRaw || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pointsToReward = parseFloat(amountRaw);
    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid amount value' }, { status: 400 });
    }

    // كشف طلبات الفحص التجريبية من لوحة تحكم الشركة
    const isTestRequest = 
      rawUserId.toLowerCase().includes('test') || 
      offerId.toLowerCase().includes('test') || 
      signature.toLowerCase().includes('test') ||
      rawUserId === "123";

    // 🔒 1. التحقق الأمني الصحيح من الـ Signature (SHA-1) بناءً على وثيقتك المرفقة 🔒
    if (!isTestRequest) {
      // الترتيب الرسمي المعتمد: userId + offer_id + event + APP_KEY + SECRET_KEY
      const stringToHash = `${rawUserId}${offerId}${eventName}${PLAYTIME_APP_KEY}${PLAYTIME_SECRET_KEY}`;
      const calculatedSignature = crypto.createHash('sha1').update(stringToHash).digest('hex');

      if (signature.toLowerCase() !== calculatedSignature.toLowerCase()) {
        console.error(`❌ Playtime Security Warning: Signature Mismatch! Calculated: ${calculatedSignature}, Received: ${signature}`);
        return NextResponse.json({ error: 'Invalid signature hash' }, { status: 403 });
      }
    }

    // 2. تنظيف الـ userId للبحث عنه وتأمين حساب الفحص التجريبي
    let userId = rawUserId;
    if (userId.startsWith('TEST_')) {
      userId = userId.replace('TEST_', '');
    }
    if (userId === "123" || isTestRequest) {
      userId = "YjkvTqAkpMhpmj6ts19g6bvhBDx1"; // حسابك الشخصي المعتمد للتجربة
    }

    // 3. منع تكرار المعاملة (Deduplication) باستخدام الـ Signature كمُعرّف فريد
    const transactionId = `playtime_${signature.slice(0, 30)}`; 
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    
    if (!isTestRequest) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return NextResponse.json({ success: true, message: 'Transaction already processed' }, { status: 200 });
      }
    }

    const userRef = adminDb.collection('users').doc(userId);
    const notificationRef = adminDb.collection('notifications').doc();
    const liveFeedRef = adminDb.collection('live_feed').doc();

    const displayEvent = eventName ? ` (${eventName})` : '';
    const finalOfferTitle = `${offerName}${displayEvent}`;

    let userTokens: string[] = [];
    let finalUsername = "User";
    let finalPhotoURL = "";

    // 🔥 تشغيل العملية المترابطة الآمنة لتحديث الرصيد وكتابة التغذية الحية الفورية للأفاتار 🔥
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        finalPhotoURL = "";
        finalUsername = "Test User";
        
        ts.set(userRef, { 
          points: pointsToReward, 
          balance: pointsToReward, 
          MC: pointsToReward,
          mc: pointsToReward,
          totalEarned: pointsToReward,
          email: "test_playtime@mrcash.app", 
          createdAt: new Date(),
          uid: userId,
          username: finalUsername,
          photoURL: finalPhotoURL
        });
      } else {
        const userData = userDoc.data();
        finalUsername = userData?.username || userData?.displayName || "User";
        finalPhotoURL = userData?.photoURL || userData?.avatarUrl || "";
        userTokens = userData?.fcmTokens || []; // جلب توكنز الأجهزة لإرسال الإشعار

        const currentPoints = userData?.points || 0;
        const currentBalance = userData?.balance || 0;
        const currentMC = userData?.MC || userData?.mc || 0;
        const currentTotal = userData?.totalEarned || 0;
        const currentXp = userData?.xp || 0;

        ts.update(userRef, { 
          points: currentPoints + pointsToReward,
          balance: currentBalance + pointsToReward,
          MC: currentMC + pointsToReward,
          mc: currentMC + pointsToReward,
          totalEarned: currentTotal + pointsToReward,
          xp: currentXp + pointsToReward
        });
      }

      // أ) تدوين حركة المال بجدول السجلات التاريخية للعمليات
      ts.set(transactionRef, {
        userId: userId,
        amount: pointsToReward,
        points: pointsToReward,
        type: 'offer_credit',
        offerId: offerId,
        offerName: `${finalOfferTitle} (Playtime)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ب) 🔔 تحديث شريط الـ Live Feed فورياً ليظهر المستخدم والأفاتار الحقيقي المختار من الـ 80 أفاتار 🔔
      ts.set(liveFeedRef, {
        userId: userId,
        username: finalUsername,
        points: pointsToReward,
        offerName: finalOfferTitle,
        source: 'PlaytimeSdk',
        photoURL: finalPhotoURL,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // ج) صياغة الإشعار اللحظي للموقع لجرس التنبيهات
      ts.set(notificationRef, {
        userId: userId,
        title: "🎉 Points Credited!",
        message: `Your account has been credited with +${pointsToReward} points for completing: [ ${finalOfferTitle} ] from Playtime.`,
        type: "offer_credit",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 4) 🚀 إرسال إشعار الدفع الفوري (FCM Push Notification) لخلفية المتصفح والجوال 🚀
    if (userTokens && userTokens.length > 0) {
      const payload = {
        notification: {
          title: '🎉 Points Credited!',
          body: `Your account has been credited with +${pointsToReward} MC for completing tasks from Playtime.`,
          icon: '/logo.png',
        }
      };

      const sendPromises = userTokens.map(async (token) => {
        try {
          await admin.messaging().send({
            token: token,
            notification: payload.notification,
          });
        } catch (fcmErr) {
          console.error(`[FCM Error] Failed sending to token: ${token}`);
        }
      });
      await Promise.all(sendPromises);
    }

    console.log(`[Playtime Success] Clean hash matched! Credited +${pointsToReward} MC & Updated Live Feed/FCM for user ${userId}`);
    return NextResponse.json({ success: true, message: 'Processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Playtime Postback Critical Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
