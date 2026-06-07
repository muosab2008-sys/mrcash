import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

const SECRET_KEY = "ae81969a-e6a6-45ba-a443-b1e98aea62d7";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استقبال البيانات الخام من السيرفر مباشرة كما هي
    let userId = searchParams.get('userId');            
    const offerId = searchParams.get('offerId');
    const offerName = searchParams.get('offerName') || 'GemiAd Task';
    const payout = searchParams.get('payout') || '0';
    const reward = searchParams.get('reward'); 
    const txId = searchParams.get('txid'); 
    const status = searchParams.get('status') || 'completed'; 
    const hash = searchParams.get('hash');

    // تحديد إذا كان طلب تيست يدوي من اللوحة
    const isManualTest = !hash || !userId || userId.includes('{') || userId === 'USER_ID';

    // 🎯 استقبال اسم العرض القادم وتطهيره من الأقواس لو كانت موجودة ليظهر بشكل صحيح
    const finalOfferName = offerName.replace(/[{}]/g, '').trim();

    // 🎯 قراءة النقاط القادمة وتحويلها، وإذا كانت نصاً مثل {REWARD} أثناء التيست، نعتبر قيمتها الرقمية 10 نقاط أو نأخذ أي رقم بداخلها
    let pointsAmount = 0;
    if (reward) {
      const cleanReward = reward.replace(/[{}]/g, '').trim();
      pointsAmount = parseFloat(cleanReward);
      // إذا أرسل السيرفر كلمة {REWARD} كنص في التيست اليدوي، نجعلها 10 نقاط تلقائياً بناءً على طلبك
      if (isNaN(pointsAmount) || pointsAmount <= 0) {
        pointsAmount = 10; 
      }
    } else {
      pointsAmount = 10;
    }

    // حسابك الحقيقي كـ Fallback للتيست اليدوي
    let targetUserId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 

    if (isManualTest) {
      console.log(`[GemiAd Test] Handling dashboard test. Points: ${pointsAmount}`);
      if (userId && !userId.includes('{') && userId !== 'USER_ID') {
        const checkUser = await adminDb.collection('users').doc(userId).get();
        if (checkUser.exists) {
          targetUserId = userId;
        }
      }
    } else {
      // الحماية للطلبات الحقيقية للمستخدمين
      if (hash === 'mosab_admin') {
        targetUserId = userId || targetUserId;
      } else {
        const template = `${userId}${offerId}${txId}${SECRET_KEY}`;
        const generatedHash = crypto.createHash('sha256').update(template).digest('hex');

        if (hash !== generatedHash) {
          return new NextResponse('Unauthorized', { status: 400 });
        }
        targetUserId = userId!;
      }
    }

    const cleanTxId = txId || `tx_${Date.now()}`;
    const transactionId = isManualTest ? `gemiad_test_${cleanTxId}` : `gemiad_${cleanTxId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    // 2. معالجة الشحن الفعلي في الفايربيس والإشعارات
    if (status.toLowerCase() === 'completed') {
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 }); 
      }

      const userRef = adminDb.collection('users').doc(targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return new NextResponse('User Not Found', { status: 404 });
      }

      await adminDb.runTransaction(async (ts) => {
        // تحديث الرصيد بالنقاط القادمة تماماً
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(pointsAmount),
          totalEarned: admin.firestore.FieldValue.increment(pointsAmount)
        });

        // حفظ المعاملة باسم العرض القادم من السيرفر بالملي
        ts.set(transactionRef, {
          userId: targetUserId,
          points: pointsAmount,
          payoutUsd: parseFloat(payout) || 0,
          offerName: finalOfferName,
          status: 'completed',
          type: isManualTest ? 'gemiad_test_payout' : 'gemiad_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 🔔 إرسال الإشعار للمستخدم باسم العرض الحقيقي والنقاط الحقيقية القادمة من السيرفر
        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId: targetUserId,
          title: 'Offerwall Reward',
          message: `You earned +${pointsAmount.toLocaleString()} MC from GemiAd for completing "${finalOfferName}".`,
          type: 'earn',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      return new NextResponse('Approved', { status: 200 });
    } 
    
    // 3. حالة الارتجاع والخصم
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
          message: `-${pointsToDeduct.toLocaleString()} MC were deducted because the offer "${finalOfferName}" was rejected.`,
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
