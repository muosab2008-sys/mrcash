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
    let offerName = searchParams.get('offer_name') || 'Offer';
    const transactionId = searchParams.get('transaction_id');

    // تنظيف اسم العرض وإزالة روابط الـ www تماماً
    if (offerName.toLowerCase().includes('www')) {
      offerName = offerName.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
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

    // التحقق من الحساب
    let userRef = adminDb.collection('users').doc(userId || 'none');
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      // الفحص الاحتياطي على حسابك الشخصي الموضح بالصورة السابقة
      userId = "NOsDSAtYfMTAM4fcrOhBxpD5Rau1"; 
      userRef = adminDb.collection('users').doc(userId);
      userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    await adminDb.runTransaction(async (ts) => {
      // التعديل الجوهري: التحديث المباشر لحقل الـ points الفعلي والـ totalEarned في موقعك
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward),
        level: admin.firestore.FieldValue.increment(1) // اختياري لزيادة ليفل المستخدم
      });

      // حفظ المعاملة
      ts.set(transactionRef, {
        userId,
        points: pointsToReward,
        payoutUsd: parseFloat(payoutUsd || '0'),
        offerName,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // إشعار الجرس الإنجليزي النظيف بدون أي منبثقات مزعجة
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
