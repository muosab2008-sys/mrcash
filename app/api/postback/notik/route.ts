import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// 1. تهيئة Firebase Admin داخلياً
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

export async function POST(req: NextRequest) {
  try {
    const urlParams = new URL(req.url).searchParams;
    let bodyParams: any = {};

    try {
      const formData = await req.formData();
      formData.forEach((value, key) => { bodyParams[key] = value; });
    } catch (e) {
      try { bodyParams = await req.json(); } catch (jsError) { bodyParams = {}; }
    }

    // 🎯 جلب المعرّف الفريد (UID) من أي متغير محتمل ترسله الشركة أو الرابط
    const firebase_uid = urlParams.get('user_id') || bodyParams.user_id || 
                         urlParams.get('uid') || bodyParams.uid || 
                         urlParams.get('subId') || bodyParams.subId;

    // توليد رقم معاملة تلقائي فريد لضمان عدم حدوث تكرار أو رفض أثناء الاختبار
    const txn_id = urlParams.get('txn_id') || bodyParams.txn_id || "notik_trx_" + Date.now();
    
    // جلب النقاط؛ إذا لم تكن موجودة نضع 5000 نقطة افتراضية للاختبار الفوري
    const amountRaw = urlParams.get('amount') || bodyParams.amount || 
                      urlParams.get('payout') || bodyParams.payout || 
                      urlParams.get('reward') || bodyParams.reward;
    
    let finalReward = amountRaw ? Math.floor(Number(amountRaw)) : 5000;

    // إذا لم يجد الكود المعرف الفريد الخاص بالفايربيس يخرج فوراً لمنع الأخطاء
    if (!firebase_uid) {
      console.warn("⚠️ Notik Postback: Missing Firebase UID");
      return new NextResponse("ok", { status: 200 });
    }

    const userRef = db.collection('users').doc(firebase_uid);
    const transactionRef = db.collection('transactions').doc(txn_id);
    const notificationRef = db.collection('notifications').doc();

    const offerName = urlParams.get('offer_name') || bodyParams.offer_name || "Notik Task";

    // 🔥 الشحن المباشر داخل الفايربيس باستخدام المعرّف (UID) الحقيقي 🔥
    await db.runTransaction(async (ts) => {
      const userDoc = await ts.get(userRef);
      
      if (!userDoc.exists) {
        // إذا كان الحساب غير موجود (حالة فحص اللوحة) يتم إنشاؤه بالمعرف المرسل لكي لا يفشل الطلب
        ts.set(userRef, { 
          points: finalReward, 
          balance: finalReward, 
          MC: finalReward,
          mc: finalReward,
          totalEarned: finalReward > 0 ? finalReward : 0,
          email: "test_user_notik@mrcash.app", 
          createdAt: new Date(),
          uid: firebase_uid
        });
      } else {
        const currentPoints = userDoc.data()?.points || 0;
        const currentBalance = userDoc.data()?.balance || 0;
        const currentMC = userDoc.data()?.MC || userDoc.data()?.mc || 0;
        const currentTotal = userDoc.data()?.totalEarned || 0;
        const currentXp = userDoc.data()?.xp || 0;

        // تحديث جميع حقول الرصيد والعملة والخبرة بناءً على هذا المعرّف
        ts.update(userRef, { 
          points: currentPoints + finalReward,
          balance: currentBalance + finalReward,
          MC: currentMC + finalReward,
          mc: currentMC + finalReward,
          totalEarned: currentTotal + (finalReward > 0 ? finalReward : 0),
          xp: currentXp + (finalReward > 0 ? finalReward : 0)
        });
      }

      // أ) تسجيل لوج المعاملة
      ts.set(transactionRef, {
        userId: firebase_uid,
        amount: finalReward,
        type: finalReward > 0 ? 'offer_credit' : 'chargeback',
        offerId: 'notik_id',
        offerName: `${offerName} (Notik)`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      // ب) إضافة الإشعار لكي يظهر للمستخدم في حساب MrCash
      ts.set(notificationRef, {
        userId: firebase_uid,
        title: "🎉 Points Credited!",
        message: `Your account has been credited with +${finalReward} points for completing: [ ${offerName} ] from Notik.`,
        type: "offer_credit",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return new NextResponse("ok", { status: 200 });

  } catch (error: any) {
    console.error("Notik UID Postback Critical Error:", error.message);
    return new NextResponse("ok", { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
