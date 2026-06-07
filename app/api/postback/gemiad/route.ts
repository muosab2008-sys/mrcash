import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. استقبال المتغيرات من رابط GemiAd
    let userId = searchParams.get('userId');            
    const offerName = searchParams.get('offerName') || 'GemiAd Task';
    const reward = searchParams.get('reward'); 
    const txId = searchParams.get('txid') || `tx_${Date.now()}`; 
    const status = searchParams.get('status') || 'completed'; 

    // 🎯 تنظيف وقراءة النقاط ديناميكياً مهما كانت القيمة المرسلة
    let pointsAmount = 0;
    if (reward) {
      // إزالة أي أقواس مثل { } قد ترسلها اللوحة في التيست التلقائي
      const cleanReward = reward.replace(/[{}]/g, '').trim();
      pointsAmount = parseFloat(cleanReward);
    }

    // إذا كانت الخانة نصية عشوائية أو فارغة، نضع 10 نقاط كحد أدنى لتجنب الصفر
    if (isNaN(pointsAmount) || pointsAmount <= 0) {
      pointsAmount = 10; 
    }

    // تنظيف اسم العرض ليظهر منسقاً في الإشعارات
    const finalOfferName = offerName.replace(/[{}]/g, '').trim();

    // تحديد حسابك كـ احتياطي لو كان الـ ID المرسل مجرد رمز تجريبي
    let targetUserId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 
    if (userId && !userId.includes('{') && userId !== 'USER_ID') {
      const checkUser = await adminDb.collection('users').doc(userId).get();
      if (checkUser.exists) {
        targetUserId = userId;
      }
    }

    // توليد معرف معاملة فريد باستخدام التوقيت لضمان عدم التكرار أثناء التجريب
    const transactionId = `gemiad_live_${Date.now()}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);

    if (status.toLowerCase() === 'completed') {
      const userRef = adminDb.collection('users').doc(targetUserId);
      const finalReward = Math.abs(pointsAmount);

      await adminDb.runTransaction(async (ts) => {
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(finalReward),
          totalEarned: admin.firestore.FieldValue.increment(finalReward)
        });

        ts.set(transactionRef, {
          userId: targetUserId,
          points: finalReward,
          offerName: finalOfferName,
          status: 'completed',
          type: 'gemiad_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 🔔 إرسال الإشعار الفوري للمستخدم بالقيمة والاسم الحقيقيين
        const notificationRef = adminDb.collection('notifications').doc();
        ts.set(notificationRef, {
          userId: targetUserId,
          title: 'Offerwall Reward',
          message: `You earned +${finalReward.toLocaleString()} MC from GemiAd for completing "${finalOfferName}".`,
          type: 'earn',
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
