import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';
import crypto from 'crypto'; 

// المفتاح السري الحقيقي والآمن لـ GemiAd
const GEMIAD_SECRET_KEY = "ae81969a-e6a6-45ba-a443-b1e98aea62d7";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. قراءة المتغيرات بكافة الصيغ المحتملة لضمان التوافق التام
    let userId = searchParams.get('userId') || searchParams.get('userid') || searchParams.get('USER_ID');            
    const offerId = searchParams.get('offerId') || searchParams.get('offerid') || searchParams.get('OFFER_ID') || 'gemiad_offer';
    const offerName = searchParams.get('offerName') || searchParams.get('offername') || searchParams.get('OFFER_NAME') || 'GemiAd Task';
    const payout = searchParams.get('payout') || searchParams.get('PAYOUT') || '0';
    const reward = searchParams.get('reward') || searchParams.get('REWARD'); 
    const txId = searchParams.get('txId') || searchParams.get('txid') || searchParams.get('TXID') || `tx_${Date.now()}`; 
    const status = searchParams.get('status') || searchParams.get('STATUS') || 'completed'; 
    const hash = searchParams.get('hash') || searchParams.get('HASH');

    // تصفية ومعالجة قيمة النقاط القادمة ديناميكياً لتصل كاملة كما هي
    const pointsAmount = reward ? parseFloat(reward) : 0;

    if (pointsAmount <= 0) {
      console.error("[GemiAd] Invalid or zero points amount received.");
      return new NextResponse('Invalid Reward', { status: 400 });
    }

    // 🎯 2. كشف نوع الطلب (تيست يدوي من اللوحة أو طلب حقيقي)
    const isManualTest = !hash || !userId || userId.includes('{') || userId === 'USER_ID';

    let targetUserId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; // حساب مصعب كاحتياط لو البيانات عشوائية

    if (isManualTest) {
      console.log(`[GemiAd] Manual Dashboard Test detected. Input User: ${userId}, Points: ${pointsAmount}`);
      // إذا كتب الأدمين يوزر حقيقي في اللوحة أثناء التيست، نشحن له
      if (userId && !userId.includes('{') && userId !== 'USER_ID') {
        const checkUser = await adminDb.collection('users').doc(userId).get();
        if (checkUser.exists) {
          targetUserId = userId;
        }
      }
    } else {
      // 🔒 3. جدار الأمان التشفيري للطلبات الحقيقية المكتملة
      if (hash === 'mosab_admin') {
        targetUserId = userId; // تخطي الأمان للأدمين
      } else {
        const template = `${userId}${offerId}${txId}${GEMIAD_SECRET_KEY}`;
        const calculatedHash = crypto.createHash('sha256').update(template).digest('hex');

        if (hash.toLowerCase() !== calculatedHash.toLowerCase()) {
          console.error('[GemiAd] Hash signature mismatch!');
          return new NextResponse('Unauthorized', { status: 400 });
        }
        targetUserId = userId;
      }
    }

    // 4. التحقق من عدم تكرار المعاملة لمنع ثغرات التكرار
    const transactionId = isManualTest ? `gemiad_test_${txId}` : `gemiad_${txId}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    // 5. معالجة الشحن الفعلي (completed)
    if (status.toLowerCase() === 'completed') {
      if (transactionDoc.exists) {
        return new NextResponse('Approved', { status: 200 }); // معاملة مكررة ممررة مسبقاً
      }

      const userRef = adminDb.collection('users').doc(targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.error(`[GemiAd] Target user ${targetUserId} not found in database.`);
        return new NextResponse('User Not Found', { status: 404 });
      }

      // ⚡ التحديث المتزامن والآمن للنقاط، المعاملات، والإشعارات
      await adminDb.runTransaction(async (ts) => {
        // أ) تحديث رصيد المستخدم
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(pointsAmount),
          totalEarned: admin.firestore.FieldValue.increment(pointsAmount)
        });

        // ب) تسجيل المعاملة في الأرشيف
        ts.set(transactionRef, {
          userId: targetUserId,
          points: pointsAmount,
          payoutUsd: parseFloat(payout),
          offerName: offerName,
          status: 'completed',
          type: isManualTest ? 'gemiad_test_payout' : 'gemiad_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // ج) 🔔 إرسال إشعار الجرس الفوري للمستخدم لكي تظهر له النقاط فوراً
        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId: targetUserId,
          title: 'Offerwall Reward',
          message: `You earned +${pointsAmount.toLocaleString()} MC from GemiAd for completing "${offerName}".`,
          type: 'earn',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      console.log(`[GemiAd] Successfully credited +${pointsAmount} MC to user ${targetUserId} with Notification.`);
      return new NextResponse('Approved', { status: 200 });
    } 
    
    // 6. حالة الارتجاع والخصم (rejected)
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
