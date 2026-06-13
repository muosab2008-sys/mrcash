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
    const forwardHeader = req.headers.get('x-forwarded-for');
    const clientIp = forwardHeader ? forwardHeader.split(',')[0].trim() : '';
    const ALLOWED_IPS = ["34.118.33.53", "138.68.125.171", "64.226.93.56"];

    if (clientIp && !ALLOWED_IPS.includes(clientIp) && !clientIp.startsWith('127.') && process.env.NODE_ENV === 'production') {
      console.warn(`Unauthorised KlinkLabs Access Attempt from IP: ${clientIp}`);
      return new NextResponse("ERROR: Unauthorised IP Address", { status: 403 });
    }

    const data = await parsePostbackData(req);
    const userId = data.userId;
    const transId = data.conversionId || `klink_live_${Date.now()}`;
    const status = data.status || 'completed'; 
    const eventType = data.eventType || 'conversion'; 

    if (!userId) {
      return new NextResponse("OK", { status: 200 });
    }

    const rawPayout = parseFloat(String(data.payout).replace(/[^0-9.-]/g, '')) || 0;
    const absolutePayout = Math.abs(rawPayout);
    
    // --- 🎯 الحسبة الجديدة والدقيقة بناءً على طلبك: 1000 نقطة لكل 1 دولار ---
    let calculatedPoints = Math.round(absolutePayout * 1000); 

    // حماية احترازية للعروض الحقيقية الصفرية
    if (calculatedPoints === 0 && !transId.includes('test')) {
      calculatedPoints = 25; 
    } else if (calculatedPoints === 0) {
      calculatedPoints = 500; // نقاط ثابتة تظهر فقط عند عمل فحص تجريبي بقيمة 0$ في لوحة التحكم
    }

    let finalReward = calculatedPoints;

    // معالجة الخصومات والمرتجعات (Chargebacks)
    if (eventType === 'chargeback' || status === 'cancelled' || rawPayout < 0) {
      finalReward = -Math.abs(calculatedPoints); 
    }

    const offerName = data.offerName || "Premium Offer";
    const transactionRef = db.collection('transactions').doc(transId);

    const transactionDoc = await transactionRef.get();
    if (transactionDoc.exists) {
      return new NextResponse("DUP", { status: 200 });
    }

    let cleanUserId = userId;
    if (cleanUserId.startsWith('TEST_')) {
      cleanUserId = cleanUserId.replace('TEST_', '');
    }

    const userRef = db.collection('users').doc(cleanUserId);
    const notificationRef = db.collection('notifications').doc();

    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        ts.set(userRef, { points: finalReward, email: `${cleanUserId}@mrcash.app`, createdAt: new Date() });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      ts.set(transactionRef, {
        userId: cleanUserId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.offerId || 'klink_task',
        offerName: `${offerName} (KlinkLabs)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      ts.set(notificationRef, {
        userId: cleanUserId,
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
    console.error("KlinkLabs Postback Dynamic Error:", error.message);
    return new NextResponse("OK", { status: 200 }); 
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
