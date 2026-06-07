import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🕵️‍♂️ خطوة المطورين: طباعة كل المتغيرات القادمة من اللوحة في الـ Logs لمعرفتها بالملي
    const allParams = Object.fromEntries(searchParams.entries());
    console.log("[GemiAd Debug] Incoming Raw Parameters:", allParams);

    // جلب اسم العرض بكافة الطرق الممكنة (سمول أو كابيتال)
    const offerName = searchParams.get('offerName') || 
                      searchParams.get('offername') || 
                      searchParams.get('OFFER_NAME') || 
                      'GemiAd Offer';

    // جلب قيمة المكافأة بكافة الطرق الممكنة
    const rewardRaw = searchParams.get('reward') || 
                      searchParams.get('REWARD') || 
                      searchParams.get('reward_amount');

    // جلب اليوزر بكافة الطرق الممكنة
    let userId = searchParams.get('userId') || 
                 searchParams.get('userid') || 
                 searchParams.get('USER_ID');

    // جلب رقم المعاملة
    const txId = searchParams.get('txid') || 
                 searchParams.get('txId') || 
                 searchParams.get('TXID');

    // تحليل النقاط ديناميكياً
    let pointsAmount = 0;
    if (rewardRaw) {
      const cleanReward = rewardRaw.replace(/[{}]/g, '').trim();
      pointsAmount = parseFloat(cleanReward);
    }

    // تنظيف اسم العرض من الأقواس
    const finalOfferName = offerName.replace(/[{}]/g, '').trim();

    // إذا عجز الكود عن قراءة النقاط، سنأخذ أول رقم نجده في الرابط كدعم إضافي للتيست
    if (isNaN(pointsAmount) || pointsAmount === 0) {
      pointsAmount = 15; // نضع 15 افتراضية إذا كانت الخانة القادمة فارغة تماماً
    }

    // تحديد حساب مصعب كـ Fallback
    let targetUserId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 
    if (userId && !userId.includes('{') && userId !== 'USER_ID') {
      const checkUser = await adminDb.collection('users').doc(userId).get();
      if (checkUser.exists) {
        targetUserId = userId;
      }
    }

    // توليد معاملة فريدة غير مكررة مع إضافة التوقيت
    const cleanTxId = txId ? txId.replace(/[{}]/g, '').trim() : `tx_${Date.now()}`;
    const transactionId = `gemiad_dynamic_${cleanTxId}_${Date.now()}`;
    const transactionRef = adminDb.collection('transactions').doc(transactionId);

    // تنفيذ الشحن المباشر في الفايربيس
    const userRef = adminDb.collection('users').doc(targetUserId);
    
    await adminDb.runTransaction(async (ts) => {
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsAmount),
        totalEarned: admin.firestore.FieldValue.increment(pointsAmount)
      });

      ts.set(transactionRef, {
        userId: targetUserId,
        points: pointsAmount,
        offerName: finalOfferName,
        status: 'completed',
        type: 'gemiad_test_payout',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 🔔 إرسال الإشعار بالاسم والنقاط
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

    console.log(`[GemiAd Success] Credited +${pointsAmount} for "${finalOfferName}"`);
    return new NextResponse('Approved', { status: 200 });

  } catch (error: any) {
    console.error('[GemiAd Postback Error]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
