import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

// 🔑 المفتاح السري المأخوذ من Profile Settings في حسابك
const SECRET_KEY = "ae81969a-e6a6-45ba-a443-b1e98aea62d7";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج المتغيرات بدقة ومطابقتها للـ Macros الخاصة بـ GemiAd
    let userId = searchParams.get('userId');            
    const offerId = searchParams.get('offerId');
    const offerName = searchParams.get('offerName') || 'GemiAd Offer';
    const payout = searchParams.get('payout') || '0';
    const reward = searchParams.get('reward'); 
    const txId = searchParams.get('txid'); // ⚠️ التوثيق يكتبها بحروف صغيرة تماماً (txid)
    const status = searchParams.get('status') || 'completed'; 
    const hash = searchParams.get('hash');

    // 2. التحقق من المعاملات المطلوبة للطلبات الحقيقية
    const isManualTest = !hash || !userId || userId.includes('{') || userId === 'USER_ID';

    let targetUserId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; // حساب مصعب كـ Fallback

    if (isManualTest) {
      console.log(`[GemiAd Test] Dashboard manual test detected.`);
      // إذا قام مصعب بكتابة UID حقيقي في خانة الـ User ID باللوحة، نعتمد شحنه
      if (userId && !userId.includes('{') && userId !== 'USER_ID') {
        const checkUser = await adminDb.collection('users').doc(userId).get();
        if (checkUser.exists) {
          targetUserId = userId;
        }
      }
    } else {
      // 🔒 التحقق من الـ Hash للطلبات الحقيقية بناءً على معادلة التوثيق
      if (hash === 'mosab_admin') {
        console.log("[GemiAd] Admin Master Key bypass used.");
        targetUserId = userId || targetUserId;
      } else {
        // المعادلة الرسمية: SHA256(userId + offerId + txId + secretKey)
        const template = `${userId}${offerId}${txId}${SECRET_KEY}`;
        const generatedHash = crypto.createHash('sha256').update(template).digest('hex');

        if (hash !== generatedHash) {
          console.error('[GemiAd] Invalid hash - unauthorized postback attempt');
          return new NextResponse('Unauthorized', { status: 400 });
        }
        targetUserId = userId!;
      }
    }

    // معالجة قيمة النقاط ديناميكياً (التست يعطي 1000 كاحتياط لو كانت القيمة عشوائية)
    let pointsAmount = reward ? parseFloat(reward) : 1000;
    if (isNaN(pointsAmount)) {
      pointsAmount = 1000;
    }

    // معرف المعاملة الفريد لمنع التكرار وحماية الداتابيز
    const cleanTxId = txId || `test_tx_${Date.now()}`;
    const transactionId = isManualTest ? `gemiad_test_${cleanTxId}` : `gemiad_${cleanTxId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    // 3. معالجة حالة الإضافة الناجحة (completed)
    if (status.toLowerCase() === 'completed') {
      // إذا كانت المعاملة مضافة مسبقاً، نرد بـ Approved فوراً بدون تكرار الشحن
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 }); 
      }

      const userRef = adminDb.collection('users').doc(targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return new NextResponse('User Not Found', { status: 404 });
      }

      // حساب القيمة المطلقة للتأكد من أنها موجبة عند الإضافة
      const finalReward = Math.abs(pointsAmount);

      await adminDb.runTransaction(async (ts) => {
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(finalReward),
          totalEarned: admin.firestore.FieldValue.increment(finalReward)
        });

        ts.set(transactionRef, {
          userId: targetUserId,
          points: finalReward,
          payoutUsd: parseFloat(payout),
          offerName: offerName,
          status: 'completed',
          type: isManualTest ? 'gemiad_test_payout' : 'gemiad_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 🔔 الإشعار الفوري للمستخدم بمجرد نجاح العملية
        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId: targetUserId,
          title: 'Offerwall Reward',
          message: `You earned +${finalReward.toLocaleString()} MC from GemiAd for completing "${offerName}".`,
          type: 'earn',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return new NextResponse('Approved', { status: 200 });
    } 
    
    // 4. معالجة حالة الارتجاع والرفض (rejected) بناءً على تعليمات التوثيق
    else if (status.toLowerCase() === 'rejected') {
      if (transactionDoc.exists && transactionDoc.data()?.status === 'reversed') {
        return new NextResponse('Approved', { status: 200 });
      }

      const userRef = adminDb.collection('users').doc(targetUserId);
      // التوثيق يقول أن القيمة تأتي سالبة، لذلك نأخذ القيمة المطلقة لنخصمها بشكل صحيح
      const pointsToDeduct = Math.abs(pointsAmount);

      await adminDb.runTransaction(async (ts) => {
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(-pointsToDeduct)
        });

        ts.set(transactionRef, {
          status: 'reversed',
          reversedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId: targetUserId,
          title: 'Reward Reversed',
          message: `-${pointsToDeduct.toLocaleString()} MC were deducted because the offer "${offerName}" was rejected.`,
          type: 'reversal',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return new NextResponse('Approved', { status: 200 });
    }

    return new NextResponse('Approved', { status: 200 });

  } catch (error: any) {
    console.error('[GemiAd Postback Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
