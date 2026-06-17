import { NextResponse } from 'next/server';
// استورد إعدادات قاعدة البيانات الخاصة بك (مثال لـ Firebase أو Appwrite أو Prisma)
// import { db } from '@/lib/db'; 

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // استقبال البيانات المرسلة من ClickWall
    const userId = searchParams.get('user_id');
    const amount = parseInt(searchParams.get('amount'), 10);
    const payout = parseFloat(searchParams.get('payout')); // القيمة بالدولار الأمريكي
    const offerName = searchParams.get('offer_name');
    const txid = searchParams.get('txid'); // المعرف الفريد للمعاملة لمنع التكرار
    const userIp = searchParams.get('user_ip');

    // 1. التحقق من وجود البيانات الأساسية
    if (!userId || !amount || !txid) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // 2. خطوة هامة جداً: تحقق في قاعدة بياناتك إن كان الـ txid قد تم تنفيذه مسبقاً لمنع تكرار إضافة النقاط
    /* 
    const isDuplicate = await db.tracker.findUnique({ where: { txid } });
    if (isDuplicate) {
      return new NextResponse('OK', { status: 200 }); // نرد بـ OK حتى لا تستمر المنصة في المحاولة
    }
    */

    // 3. تحديث نقاط المستخدم في قاعدة البيانات وإضافة سجل العملية (Tracker)
    // مثال منطقي للتحديث:
    /*
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { points: { increment: amount } }
      }),
      db.tracker.create({
        data: {
          userId,
          points: amount,
          type: `ClickWall: ${offerName} - IP: ${userIp}`,
          txid,
          payout
        }
      })
    ]);
    */

    console.log(`Successfully credited ${amount} points to user: ${userId} for transaction: ${txid}`);

    // 4. الرد المطلوب من ClickWall لإغلاق المعاملة بنجاح
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('ClickWall Postback Error:', error);
    // نرد بـ 500 في حال حدوث خطأ بالسيرفر لكي تحاول المنصة إرسال الـ Postback لاحقاً ولا تضيع نقاط المستخدم
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
