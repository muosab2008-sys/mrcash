import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

// 1. Initialize Firebase Admin internally
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

// Helper function to generate MD5 hash for postback validation
function generateMd5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

// 2. Smart data parser supporting both Form-Data and URL Search Params
async function parsePostbackData(req: NextRequest) {
  const urlParams = new URL(req.url).searchParams;
  let bodyParams: any = {};

  try {
    const formData = await req.formData();
    formData.forEach((value, key) => {
      bodyParams[key] = value;
    });
  } catch (e) {
    try {
      bodyParams = await req.json();
    } catch (jsError) {
      bodyParams = {};
    }
  }

  return {
    subId: bodyParams.subId || urlParams.get('subId'),
    transId: bodyParams.transId || urlParams.get('transId'),
    reward: bodyParams.reward || urlParams.get('reward'),
    payout: bodyParams.payout || urlParams.get('payout'),
    status: bodyParams.status || urlParams.get('status'),
    signature: bodyParams.signature || urlParams.get('signature'),
    offer_name: bodyParams.offer_name || urlParams.get('offer_name'),
    offer_id: bodyParams.offer_id || urlParams.get('offer_id'),
  };
}

export async function POST(req: NextRequest) {
  try {
    // Extract parsed postback data
    const data = await parsePostbackData(req);

    const subId = data.subId;
    // Generate a unique test ID if the dashboard sends an empty transaction ID
    const transId = data.transId && data.transId !== "undefined" && data.transId !== "" 
      ? data.transId 
      : `test_${Date.now()}`;
    
    const reward = data.reward;
    const status = data.status || 1;
    const signature = data.signature;

    // Validate required parameters
    if (!subId || (!reward && !data.payout)) {
      console.warn("Offery Postback: Missing required parameters", data);
      return new NextResponse("ERROR: Missing Parameters", { status: 400 });
    }

    const SECRET_KEY = process.env.OFFERY_SECRET_KEY;
    if (!SECRET_KEY) {
      console.error("Missing OFFERY_SECRET_KEY in Environment Variables");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    // 3. Security Check: Validate Signature
    if (signature && signature !== "undefined" && signature !== "null" && signature !== "") {
      const expectedSignature = generateMd5(`${subId}${transId}${reward}${SECRET_KEY}`);
      if (expectedSignature !== signature) {
        console.warn(`Security Warning: Signature mismatch for transId: ${transId}`);
        return new NextResponse("ERROR: Signature doesn't match", { status: 400 });
      }
    }

    // 4. Clean and parse points reward
    let finalReward = parseFloat(String(reward).replace(/[^0-9.]/g, ''));
    
    // Fallback calculation based on payout if pure points reward is missing (e.g. Test Mode)
    if (isNaN(finalReward)) {
      const payoutVal = parseFloat(String(data.payout).replace(/[^0-9.]/g, '')) || 0.005;
      finalReward = payoutVal * 2000; // Rate exchange: 2000 points per $1
    }

    // Handle Chargebacks / Refunds
    if (status === 2 || status === '2') {
      finalReward = -Math.abs(finalReward);
    }

    // 5. English-only intelligent offer name resolution
    const offerName = data.offer_name && data.offer_name !== "undefined" && data.offer_name !== "" 
      ? data.offer_name 
      : "Premium Offer";

    const transactionRef = db.collection('transactions').doc(transId);
    
    // Deduplication filter (allows continuous test requests starting with 'test_')
    if (!transId.startsWith('test_')) {
      const transactionDoc = await transactionRef.get();
      if (transactionDoc.exists) {
        return new NextResponse("ok", { status: 200 });
      }
    }

    const userRef = db.collection('users').doc(subId);
    const notificationRef = db.collection('notifications').doc(); // Auto-generates a unique notification document ID

    // 6. Firestore Atomicity Transaction for processing balance and English logs simultaneously
    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // Auto-create missing test profile to ensure dashboard requests don't drop
        ts.set(userRef, { points: finalReward, email: "test_user@mrcash.app", createdAt: new Date() });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      // A) Register Transaction History Log
      ts.set(transactionRef, {
        userId: subId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: data.offer_id || 'test_id',
        offerName: `${offerName} (Offery)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // B) Inject English Real-time Notification Document (تم إضافة اسم الشركة هنا)
      ts.set(notificationRef, {
        userId: subId,
        title: finalReward > 0 ? "🎉 Points Credited!" : "⚠️ Points Deducted",
        message: finalReward > 0 
          ? `Your account has been credited with +${finalReward} points for completing: [ ${offerName} ] from Offery.`
          : `Your account was deducted by ${Math.abs(finalReward)} points due to offer cancellation from Offery.`,
        type: finalReward > 0 ? "offer_credit" : "chargeback", // Matches Client-side Toast Switch
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp() // Accurate real-time syncing field
      });
    });

    // 7. Standard status return code for postback acceptance
    return new NextResponse("ok", { status: 200 });

  } catch (error: any) {
    console.error("Offery S2S Postback Critical Error:", error.message);
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}

// GET support handler for visual parsing and dashboard diagnostics
export async function GET(req: NextRequest) {
  return POST(req);
}
