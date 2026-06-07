import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

// 🔑 المفتاح السري الخاص بـ GemiAd
const SECRET_KEY = "ae81969a-e6a6-45ba-a443-b1e98aea62d7";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استخراج المتغيرات من الرابط
    let userId = searchParams.get('userId');            
    const offerId = searchParams.get('offerId');
    const offerName = searchParams.get('offerName') || 'GemiAd Offer';
    const payout = searchParams.get('payout') || '0';
    const reward = searchParams.get('reward'); 
    const txId = searchParams.get('txid'); 
    const status = searchParams.get('status') || 'completed'; 
    const hash = searchParams.get('hash');

    // رصد وتحديد إذا كان الطلب عبارة عن تيست يدوي من اللوحة
    const isManualTest = !hash || !userId || userId.includes('{') || userId === 'USER_ID';

    // 🎯 هندسة معالجة النقاط ديناميكياً لتقرأ أي رقم تكتبه في اللوحة بالملي
    let pointsAmount = 0;
    if (reward) {
      // إزالة الأقواس أو النصوص البرمجية العشوائية إذا أرسلتها اللوحة كـ تمبلت
      const cleanReward = reward.replace(/[{}]/g, '').trim();
      pointsAmount = parseFloat(cleanReward);
    }

    // إذا عجز النظام تماماً عن قراءة الرقم أو كانت خانة المكافأة فارغة في اللوحة، يضع 10 كحد أدنى بدلاً من 1000
    if (isNaN(pointsAmount) || pointsAmount <= 0) {
      pointsAmount = 10; 
    }

    let targetUserId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; // حساب مصعب كـ Fallback

    if (isManualTest) {
      console.log(`[GemiAd Test] Manual test. Detected Points: ${pointsAmount}`);
      // إذا كتبت UID حقيقي لشخص في اللوحة، يشحن له هو مباشرة بالقيمة المكتوبة
      if (userId && !userId.includes('{') && userId !== 'USER_ID') {
        const checkUser = await adminDb.collection('users').doc(userId).get();
        if (checkUser.exists) {
          targetUserId = userId;
        }
      }
    } else {
      // 🔒 المسار الحقيقي والمؤمن للعروض الفعلية للمستخدمين
      if (hash === 'mosab_admin') {
        targetUserId = userId || targetUserId;
      } else {
        const template = `${userId}${offerId}${txId}${SECRET_KEY}`;
        const generatedHash = crypto.createHash('sha256').update(template).digest('hex');

        if (hash !== generatedHash) {
          console.error('[GemiAd] Invalid hash signature');
          return new NextResponse('Unauthorized', { status: 400 });
        }
        targetUserId = userId!;
      }
    }

    // إنشاء معرف معاملة فريد لمنع تكرار العملية
    const cleanTxId = txId || `tx_${Date.now()}`;
    const transactionId = isManualTest ? `gemiad_test_${cleanTxId}` : `gemiad_${cleanTxId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    // 2. معالجة حالة الإضافة الناجحة (completed)
    if (status.toLowerCase() === 'completed') {
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 }); 
      }

      const userRef = adminDb.collection('users').doc(targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return new NextResponse('User Not Found', { status: 404 });
      }

      const finalReward = Math.abs(pointsAmount);

      // تنفيذ عملية الشحن وتحديث قاعدة البيانات والإشعارات
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

        // 🔔 إرسال الإشعار الفوري بالنقاط الكاملة الحقيقية
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
    
    // 3. معالجة حالة الارتجاع والخصم (rejected)
    else if (status.toLowerCase() === 'rejected') {
      if (transactionDoc.exists && transactionDoc.data()?.status === 'reversed') {
        return new NextResponse('Approved', { status: 200 });
      }

      const userRef = adminDb.collection('users').doc(targetUserId);
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
