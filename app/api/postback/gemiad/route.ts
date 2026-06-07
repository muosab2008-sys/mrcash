import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. قراءة البيانات القادمة من اللوحة أو السيرفر مباشرة كما هي
    let userId = searchParams.get('userId') || searchParams.get('userid') || searchParams.get('USER_ID');            
    const offerId = searchParams.get('offerId') || searchParams.get('offerid');
    const offerName = searchParams.get('offerName') || searchParams.get('offername') || 'GemiAd Offer';
    const payout = searchParams.get('payout') || '0';
    const reward = searchParams.get('reward'); 
    const txId = searchParams.get('txid') || searchParams.get('txId'); 
    const status = searchParams.get('status') || 'completed'; 

    // 🎯 قراءة النقاط ديناميكياً وتحويلها بدقة كما جاءت (إذا كتبت 15 ستكون 15، وإذا كتبت 100,000 ستكون 100,000)
    let pointsAmount = 0;
    if (reward) {
      // تنظيف النص من أي أقواس عشوائية وقراءته كرقم حقيقي
      const cleanReward = reward.replace(/[{}]/g, '').trim();
      pointsAmount = parseFloat(cleanReward);
    }

    // إذا كانت الخانة فارغة تماماً ولم يكتب فيها أي شيء، نضع 0
    if (isNaN(pointsAmount)) {
      pointsAmount = 0;
    }

    // تنظيف اسم العرض أو اللعبة المكتوبة في اللوحة ليظهر بالملي في الموقع
    const finalOfferName = offerName.replace(/[{}]/g, '').trim();

    // تحديد المستخدم (إذا كان الـ ID عشوائي أو فارغ، يتم الشحن لحسابك مصعب كـ احتياط)
    let targetUserId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 
    if (userId && !userId.includes('{') && userId !== 'USER_ID') {
      const checkUser = await adminDb.collection('users').doc(userId).get();
      if (checkUser.exists) {
        targetUserId = userId;
      }
    }

    // توليد رقم معاملة فريد لكي لا يرفضه الفايربيس بسبب التكرار أثناء التيست المتتالي
    const cleanTxId = txId ? txId.replace(/[{}]/g, '').trim() : `tx_${Date.now()}`;
    const transactionId = `gemiad_dynamic_${cleanTxId}_${Date.now()}`; // إضافة التوقيت لضمان عدم التكرار أبداً أثناء الفحص
    const transactionRef = adminDb.collection('transactions').doc(transactionId);

    // 2. تنفيذ عملية الشحن الفوري بناءً على الحالة القادمة
    if (status.toLowerCase() === 'completed') {
      const userRef = adminDb.collection('users').doc(targetUserId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return new NextResponse('User Not Found', { status: 404 });
      }

      const finalReward = Math.abs(pointsAmount);

      await adminDb.runTransaction(async (ts) => {
        // تحديث الحساب بالنقاط القادمة بالملي (القيمة التي كتبتها بيدك)
        ts.update(userRef, {
          points: admin.firestore.FieldValue.increment(finalReward),
          totalEarned: admin.firestore.FieldValue.increment(finalReward)
        });

        // تسجيل المعاملة باسم اللعبة والنقاط الحقيقية المكتوبة
        ts.set(transactionRef, {
          userId: targetUserId,
          points: finalReward,
          payoutUsd: parseFloat(payout) || 0,
          offerName: finalOfferName,
          status: 'completed',
          type: 'gemiad_payout',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 🔔 إرسال الإشعار الفوري باسم اللعبة التي كتبتها والنقاط التي حددتها
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

      console.log(`[GemiAd Success] Credited +${finalReward} for "${finalOfferName}" to user ${targetUserId}`);
      return new NextResponse('Approved', { status: 200 });
    }

    return new NextResponse('Approved', { status: 200 });

  } catch (error: any) {
    console.error('[GemiAd Postback Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
