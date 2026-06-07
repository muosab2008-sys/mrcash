import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; 
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. جلب الـ user_id الديناميكي القادم من رابط الشركة مباشرة (لكل الناس)
    const userId = searchParams.get('user_id');            
    const offerId = searchParams.get('offer_id') || '123';
    const offerName = searchParams.get('offer_name') || 'Playtime Task';
    const amountStr = searchParams.get('amount'); 
    const taskId = searchParams.get('task_id') || '1';
    const taskName = searchParams.get('task_name') || '';
    const transactionId = searchParams.get('transaction_id') || `pt_${Date.now()}`;

    // التحقق من وجود المعطيات الأساسية المطلوبة لإتمام الشحن
    if (!amountStr || !userId) {
      console.warn("Playtime Postback: Missing required parameters (user_id or amount)");
      return NextResponse.json({ error: 'Missing user_id or amount' }, { status: 400 });
    }

    const pointsToReward = parseInt(amountStr, 10);

    if (isNaN(pointsToReward) || pointsToReward <= 0) {
      return NextResponse.json({ error: 'Invalid points value' }, { status: 400 });
    }

    // 2. 🛡️ حماية ضد التكرار (Deduplication): التحقق من عدم تكرار شحن نفس العملية
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (transactionDoc.exists) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    // 3. 🔍 جلب وثيقة المستخدم الحقيقي للتأكد من وجود حسابه في الموقع فعلياً
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    // 🛑 حماية فولاذية ضد الهاكرز وكسر النقاط: إذا كان الحساب وهمياً أو غير مسجل، يتم صد المحاولة فوراً
    if (!userDoc.exists) {
      console.warn(`Unauthorized Postback Attempt: User [${userId}] does not exist in Firestore.`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // صياغة اسم العرض بشكل احترافي
    const displayTask = taskName ? ` - ${taskName}` : '';
    const finalOfferTitle = `${offerName}${displayTask}`;

    // 4. تشغيل الـ Firestore Transaction لشحن الحساب وتحديث السجلات دفعة واحدة بأمان عالي
    await adminDb.runTransaction(async (ts) => {
      
      // أ) شحن النقاط وتحديث إجمالي الأرباح للمستخدم الحالي القائم بالعرض
      ts.update(userRef, {
        points: admin.firestore.FieldValue.increment(pointsToReward),
        totalEarned: admin.firestore.FieldValue.increment(pointsToReward)
      });

      // ب) تسجيل المعاملة في سجل الـ History بالتوافق مع الحقول الجديدة
      ts.set(transactionRef, {
        userId: userId,
        points: pointsToReward,
        amount: pointsToReward, // مضاف للتوافق الشامل والاحتياط
        offerName: finalOfferTitle,
        status: 'completed',
        type: 'offer_credit', 
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // ج) حقن وثيقة الإشعار بالإنجليزية المتوافقة 100% مع الـ Index والـ Provider الجديد لتفجير التوست الأزرق 🚀
      const notificationRef = adminDb.collection('notifications').doc();
      ts.set(notificationRef, {
        userId: userId,
        title: '🎉 Points Credited!',
        message: `Your account has been credited with +${pointsToReward} points for completing: [ ${finalOfferTitle} ].`,
        type: 'offer_credit', // يطابق السويتش في الفرونت-إند لتشغيل الهدية والتوست الأزرق
        points: pointsToReward, 
        amount: pointsToReward, 
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp() // الحقل السحري المطابق للفهرس (Index) الجديد
      });
    });

    // الرد النهائي الذي يؤكد للشركة نجاح المعالجة تماماً
    return NextResponse.json({ success: true, message: 'Playtime postback processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('[Playtime Critical Error]:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
