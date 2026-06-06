import { NextRequest, NextResponse } from 'next/server';

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
    const points = searchParams.get('points');
    const userId = searchParams.get('user_id');
    const offerId = searchParams.get('offer_id');
    const offerName = searchParams.get('offer_name');
    const transactionId = searchParams.get('transaction_id');
    const conversionId = searchParams.get('conversion_id');
    const geo = searchParams.get('geo');
    const timestamp = searchParams.get('timestamp');

    if (!userId || !points || !transactionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`[Adtowall] Success: Added ${points} points to user ${userId}`);

    return NextResponse.json({ success: true, message: 'Postback processed' }, { status: 200 });

  } catch (error) {
    console.error('[Adtowall Postback Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
