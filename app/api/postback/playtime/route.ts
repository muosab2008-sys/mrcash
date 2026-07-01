import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; // مدمجة في Node.js لعمل تشفير SHA-1

export const dynamic = 'force-dynamic';

// جلب المفاتيح الخاصة بـ Playtime SDK من متغيرات البيئة (.env) لحمايتها
const PLAYTIME_APP_KEY = process.env.PLAYTIME_APP_KEY || "YOUR_APPLICATION_KEY";
const PLAYTIME_SECRET_KEY = process.env.PLAYTIME_SECRET_KEY || "YOUR_APPLICATION_SECRET_KEY";

export async function POST(req: NextRequest) {
  try {
    // 1. استخراج المتغيرات من الرابط (URL Query) أو جسم الطلب (Body)
    const urlParams = new URL(req.url).searchParams;
    let bodyParams: any = {};

    try {
      const formData = await req.formData();
      formData.forEach((value, key) => { bodyParams[key] = value; });
    } catch (e) {
      try { bodyParams = await req.json(); } catch (jsError) { bodyParams = {}; }
    }

    // مطابقة المتغيرات بناءً على توثيق Playtime SDK الرسمي
    const firebase_uid = urlParams.get('user_id') || bodyParams.user_id;
    const offerId = urlParams.get('offer_id') || bodyParams.offer_id;
    const offerName = urlParams.get('offer_name') || bodyParams.offer_name || "Playtime Offer";
    const amountRaw = urlParams.get('amount') || bodyParams.amount;
    const txn_id = urlParams.get('signature') || bodyParams.signature; // نستخدم الـ signature كـ ID فريد للمعاملة لمنع التكرار
    const incomingSignature = urlParams.get('signature') || bodyParams.signature;
    const eventName = urlParams.get('event') || bodyParams.event || "";

    // التحقق من المعاملات الأساسية لضمان سلامة الطلب
    if (!firebase_uid || !offerId || !incomingSignature || !amountRaw) {
      console.warn("⚠️ Playtime Postback: Missing vital parameters.");
      return new NextResponse("ERROR: Missing Parameters", { status: 400 });
    }

    // 2. نظام نظام الحماية والتوثيق (Signature Validation)
    // التوثيق يطلب: sha1(user_id + offer_id + event + APP_KEY + SECRET_KEY)
    const dataToHash = `${firebase_uid}${offerId}${eventName}${PLAYTIME_APP_KEY}${PLAYTIME_SECRET_KEY}`;
    const calculatedSignature = crypto.createHash('sha1').update(dataToHash).digest('hex');

    if (incomingSignature !== calculatedSignature) {
      console.error(`❌ Playtime Security Warning: Invalid Signature Attempt for user: ${firebase_uid}`);
      return new NextResponse("ERROR: Invalid Signature", { status: 403 });
    }

    // تحويل النقاط إلى رقم صحيح آمن
    const finalReward = Math.floor(Number(amountRaw));
    if (finalReward <= 0) {
      console.warn(`⚠️ Playtime Postback: Zero or invalid points received: ${amountRaw}`);
      return new NextResponse("ERROR: Invalid Amount", { status: 400 });
    }

    // 3. فحص ومنع تكرار المعاملة (Deduplication)
    // نستخدم الـ signature الفريد المتولد من الشركة كـ Document ID لضمان عدم تكرار نفس العملية أبداً
    const transactionRef = adminDb.collection('transactions').doc(`playtime_${incomingSignature}`);
    const transactionDoc = await transactionRef.get();
    
    if (transactionDoc.exists) {
      console.log(`ℹ️ Playtime Postback: Duplicate transaction skipped: ${incomingSignature}`);
      return new NextResponse("ok", { status: 200 }); // مكرر، نرد بـ ok لمنع الخسارة المادية والشحن المزدوج
    }

    const userRef = adminDb.collection('users').doc(firebase_uid);
    const notificationRef = adminDb.collection('notifications').doc();

    // 4. تشغيل العملية التبادلية (Transaction) للشحن المباشر في Firestore
    await adminDb.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // في البيئة الحقيقية، لا يجب شحن حساب غير موجود لتفادي الاختراقات وحسابات البوتات
        throw new Error(`User ${firebase_uid} does not exist in database.`);
      }

      const userData = userDoc.data();
      const currentPoints = userData?.points || 0;
      const currentBalance = userData?.balance || 0;
      const currentMC = userData?.MC || userData?.mc || 0;
      const currentTotal = userData?.totalEarned || 0;
      const currentXp = userData?.xp || 0;

      // تحديث كافة حقول الأرباح والـ MC في تطبيق MrCash فوراً وبشكل تراكمي آمن
      ts.update(userRef, { 
        points: currentPoints + finalReward,
        balance: currentBalance + finalReward,
        MC: currentMC + finalReward,
        mc: currentMC + finalReward,
        totalEarned: currentTotal + finalReward,
        xp: currentXp + finalReward
      });

      // أ) تسجيل الفاتورة التاريخية في الأرشيف
      ts.set(transactionRef, {
        userId: firebase_uid,
        amount: finalReward,
        type: 'offer_credit',
        offerId: offerId,
        offerName: `${offerName} (Playtime)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed',
        signature: incomingSignature
      });

      // ب) إرسال الإشعار لتنبيه الـ Toast المنبثق في تطبيق MrCash
      ts.set(notificationRef, {
        userId: firebase_uid,
        title: "🎉 Points Credited!",
        message: `Your account has been credited with +${finalReward} points for completing: [ ${offerName} ] from Playtime.`,
        type: "offer_credit",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // الرد بـ ok حسب طلب المنصات الإعلانية عند نجاح العملية بالكامل
    return new NextResponse("ok", { status: 200 });

  } catch (error: any) {
    console.error("❌ Playtime Postback Critical Error:", error.message);
    // إذا كان الخطأ بسبب أن المستخدم غير موجود، نرجع 400، عدا ذلك نرجع 500 لإعادة المحاولة
    const statusCode = error.message.includes('does not exist') ? 400 : 500;
    return new NextResponse(`ERROR: ${error.message}`, { status: statusCode });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
