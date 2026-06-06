import { NextRequest, NextResponse } from 'next/server';

// الـ IP المعتمد والمطلوب حظره من قِبل Adtowall [cite: 19]
const ALLOWED_IP = '64.226.124.135'; [cite: 19]

export async function GET(request: NextRequest) {
  try {
    // 1. التحقق من الحماية (IP Whitelisting)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip;

    if (clientIp !== ALLOWED_IP) {
      return NextResponse.json({ error: 'Unauthorized IP access' }, { status: 401 });
    }

    // 2. استخراج الماكروز (Macros) القادمة من الـ URL
    const { searchParams } = new URL(request.url);
    
    const payoutUsd = searchParams.get('payout_usd');       // {payout_usd} [cite: 10]
    const points = searchParams.get('points');             // {points} [cite: 11]
    const userId = searchParams.get('user_id');             // {user_id} [cite: 12]
    const offerId = searchParams.get('offer_id');           // {offer_id} [cite: 13]
    const offerName = searchParams.get('offer_name');       // {offer_name} [cite: 14]
    const transactionId = searchParams.get('transaction_id');// {transaction_id} [cite: 15]
    const conversionId = searchParams.get('conversion_id'); // {conversion_id} [cite: 16]
    const geo = searchParams.get('geo');                   // {geo} [cite: 17]
    const timestamp = searchParams.get('timestamp');       // {timestamp} [cite: 18]

    // 3. التحقق من المعطيات الأساسية لإتمام العملية
    if (!userId || !points || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // --------------------------------------------------------
    // TODO: منطق قاعدة البيانات الخاص بتطبيقك (MrCash)
    // هنا تقوم بـ:
    // 1. الفحص في قاعدة البيانات إذا كان الـ transactionId مكرر أم لا منعا للاحتيال.
    // 2. إضافة قيمة الـ points إلى رصيد حساب المستخدم صاحب الـ userId.
    // 3. تسجيل المعاملة في سجل الأرباح (History).
    // --------------------------------------------------------

    console.log(`[Adtowall] Success: Added ${points} points to user ${userId}`);

    // 4. إرسال رد ناجح للسيرفر الخاص بهم
    return NextResponse.json({ success: true, message: 'Postback processed' }, { status: 200 });

  } catch (error) {
    console.error('[Adtowall Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
