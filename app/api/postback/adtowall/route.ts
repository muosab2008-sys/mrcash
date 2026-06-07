import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

const ALLOWED_IP = '64.226.124.135';

export async function GET(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip;

    if (clientIp !== ALLOWED_IP) {
      return NextResponse.json({ error: 'Unauthorized IP access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const payoutUsd = searchParams.get('payout_usd');      
    const pointsStr = searchParams.get('points');          
    let userId = searchParams.get('user_id');            
    let offerName = searchParams.get('offer_name') || 'Adtowall Task';
    const transactionId = searchParams.get('transaction_id');

    // 1. تنظيف اسم العرض تماماً من علامات [WW] أو روابط الـ www ليكون المظهر احترافياً
    if (offerName.includes('[WW]') || offerName.toLowerCase().includes('www')) {
      offerName = 'Adtowall Task';
    }

    if (!pointsStr || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pointsToReward = parseInt(pointsStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // التحقق من الحساب والتحويل الاحتياطي لحسابك
    let userRef = adminDb.collection('users').doc(userId || 'none');
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      userId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 
      userRef = adminDb.collection('users').doc(userId);
      userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    await adminDb.runTransaction(async (ts) => {
      // تحديث حقول النقاط الفعالة بموقعك
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // 2. تعديل حفظ كائن المعاملة لتجنب إظهاره كنص معلق في واجهة الـ Live الفيد
      ts.set(transactionRef, {
        userId,
        points: pointsToReward,
        payoutUsd: parseFloat(payoutUsd || '0'),
        offerName,
        status: 'completed',
        // جعل الحقل متوافقاً مع سجلاتك الأساسية لحماية الواجهة
        type: 'offerwall_payout', 
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. إضافة الإشعار النظيف داخل الجرس فقط بالإنجليزية المرسومة
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId,
        title: 'Points Credited',
        message: `You received +${pointsToReward} points from Adtowall for completing "${offerName}" task.`,
        type: 'earn',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ success: true, message: 'Postback completed' }, { status: 200 });

  } catch (error: any) {
    console.error('[Adtowall Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
