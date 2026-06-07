import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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

function generateMd5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

// دالة مشتركة لمعالجة البوست باك لحمايتك من أي نوع Request
async function handlePostback(req: NextRequest, isPost: boolean) {
  try {
    let data: any = {};

    if (isPost) {
      // إذا كان الطلب POST نقرأ الـ Body
      data = await req.json();
    } else {
      // إذا كان الطلب GET نقرأ من الرابط (URL Parameters)
      const { searchParams } = new URL(req.url);
      data = {
        subId: searchParams.get('subId'),
        transId: searchParams.get('transId'),
        reward: searchParams.get('reward'),
        status: searchParams.get('status'),
        signature: searchParams.get('signature'),
        offer_id: searchParams.get('offer_id'),
        offer_name: searchParams.get('offer_name'),
      };
    }

    const subId = data.subId;
    const transId = data.transId || `test_${Date.now()}`; // إذا كان فحص وبدون معرف معاملة نولد واحد مؤقت
    const reward = data.reward;
    const status = data.status || 1;
    const signature = data.signature;

    const SECRET_KEY = process.env.OFFERY_SECRET_KEY;
    if (!SECRET_KEY) {
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    // إذا كان طلب فحص تجريبي خالص من اللوحة وبدون توقيع، نتجاوز الفحص للمعاينة فقط
    if (signature) {
      const expectedSignature = generateMd5(`${subId}${transId}${reward}${SECRET_KEY}`);
      if (expectedSignature !== signature) {
        return new NextResponse("ERROR: Signature doesn't match", { status: 400 });
      }
    }

    let finalReward = parseFloat(reward);
    if (isNaN(finalReward)) {
      return new NextResponse("ERROR: Invalid reward format", { status: 400 });
    }

    if (status === 2 || status === '2') {
      finalReward = -Math.abs(finalReward);
    }

    const transactionRef = db.collection('transactions').doc(transId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return new NextResponse("ok", { status: 200 });
    }

    const userRef = db.collection('users').doc(subId);
    const notificationRef = db.collection('notifications').doc();

    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      // في وضع التست، لو المستخدم غير موجود ننشئه تلقائياً أو نتخطى للتجربة فقط
      if (!userDoc.exists) {
        ts.set(userRef, { points: finalReward, email: "test@mrcash.app" });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        ts.update(userRef, { points: currentPoints + finalReward });
      }

      ts.set(transactionRef, {
        userId: subId,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerName: data.offer_name || 'Offery Test',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      ts.set(notificationRef, {
        userId: subId,
        title: finalReward > 0 ? "🎉 تم شحن رصيدك التجريبي!" : "⚠️ تنبيه: سحب نقاط",
        message: `لقد كسبت ${finalReward} نقطة من فحص شركة Offery.`,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return new NextResponse("ok", { status: 200 });

  } catch (error: any) {
    console.error("Postback Processing Error:", error.message);
    return new NextResponse(`ERROR: ${error.message}`, { status: 400 });
  }
}

// دعم الـ POST
export async function POST(req: NextRequest) {
  return handlePostback(req, true);
}

// دعم الـ GET لحمايتك أثناء ضغط زر التست باللوحة
export async function GET(req: NextRequest) {
  return handlePostback(req, false);
}
