import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.message);
  }
}

const db = admin.firestore();

async function parsePostbackData(req: NextRequest) {
  const urlParams = new URL(req.url).searchParams;
  let bodyParams: any = {};

  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      bodyParams = await req.json();
    }
  } catch (e) {
    bodyParams = {};
  }

  return {
    userId: urlParams.get('userId') || urlParams.get('user_id') || bodyParams.userId || bodyParams.user_id,
    payout: urlParams.get('payout') || bodyParams.payout,
    status: urlParams.get('status') || bodyParams.status,
    eventType: urlParams.get('eventType') || bodyParams.eventType,
    conversionId: urlParams.get('conversionId') || urlParams.get('conversion_id') || bodyParams.conversionId,
    offerName: urlParams.get('offerName') || urlParams.get('offer_name') || bodyParams.offerName,
    offerId: urlParams.get('offerId') || urlParams.get('offer_id') || bodyParams.offerId,
  };
}

export async function POST(req: NextRequest) {
  try {
    const data = await parsePostbackData(req);
    let userId = data.userId;
    const transId = data.conversionId || `klink_conversion_${Date.now()}`;
    const status = data.status || 'completed'; 
    const eventType = data.eventType || 'conversion'; 
    const rawPayout = parseFloat(String(data.payout).replace(/[^0-9.-]/g, '')) || 0;

    // 🎯 [تعديل الفحص الذكي]: إذا أرسلت الشركة مستخدم وهمي أو فارغ أو الـ Payout صفر (وضع التست)
    // سنجلب حساب مستخدم حقيقي من تطبيقك لإرسال الإشعار والـ 500 نقطة له حتى ترى النتيجة بنفسك في الموقع!
    if (!userId || rawPayout === 0 || userId.includes('test') || userId.includes('pub-')) {
      const usersSnapshot = await db.collection('users').limit(1).get();
      if (!usersSnapshot.empty) {
        userId = usersSnapshot.docs[0].id; // سيأخذ الـ ID الخاص بك أو بأول مستخدم مسجل
      } else {
        userId = "fallback_user_id"; 
      }
    }

    // --- 🎯 احتساب النقاط الحقيقي (1 دولار = 1000 نقطة) ---
    const absolutePayout = Math.abs(rawPayout);
    let calculatedPoints = Math.round(absolutePayout * 1000); 

    // إذا كنا في وضع الفحص (الـ Payout صفر)، نجبر الكود على إعطاء 500 نقطة للتجربة فقط كما طلبت!
    if (rawPayout === 0) {
      calculatedPoints = 500; 
    }

    let finalReward = calculatedPoints;

    // معالجة الخصومات والمرتجعات (Chargebacks)
    if (eventType === 'chargeback' || status === 'cancelled' || rawPayout < 0) {
      finalReward = -Math.abs(calculatedPoints); 
    }

    const offerName = data.offerName || "Klink Test Offer";
    const transactionRef = db.collection('transactions').doc(transId);

    // منع تكرار العمليات
    const transactionDoc = await transactionRef.get();
    if (transactionDoc.exists) {
      return new NextResponse("DUP", { status: 200 });
    }

    const userRef = db.collection('users').doc(userId);
    const notificationRef = db.collection('notifications').doc();

    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        ts.set(userRef, { points: finalReward, email: "user@mrcash.app", createdAt: new Date() });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      // تسجيل العملية في الـ Transactions
      ts.set(transactionRef, {
        userId: userId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.offerId || 'klink_task',
        offerName: `${offerName} (KlinkLabs)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // إرسال الإشعار الفوري للموقع بقيمة الـ 500 نقطة للتجربة (تمنع الصفر تماماً وتظهر في الموقع)
      ts.set(notificationRef, {
        userId: userId,
        title: finalReward > 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: finalReward > 0 
          ? `Your account has been credited with +${finalReward} points for completing: [ ${offerName} ] from KlinkLabs.`
          : `Your account was deducted by ${Math.abs(finalReward)} points due to offer cancellation from KlinkLabs.`,
        type: finalReward > 0 ? "offer_credit" : "chargeback",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    console.error("KlinkLabs Postback Error:", error.message);
    return new NextResponse("OK", { status: 200 }); 
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
