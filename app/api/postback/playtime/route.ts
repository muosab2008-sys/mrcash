import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  try {
    // 1. Parse the incoming request URL to read the query parameters
    const { searchParams } = new URL(request.url);
    
    // Extract parameters exactly as defined in your URL structure
    const userId = searchParams.get('user_id');
    const offerId = searchParams.get('offer_id');
    const payout = searchParams.get('payout');
    const amount = searchParams.get('amount');
    const signature = searchParams.get('signature');
    const event = searchParams.get('event');
    const offerName = searchParams.get('offer_name');

    // 2. Fetch secure credentials from your Vercel Environment Variables
    const APP_KEY = process.env.PLAYTIME_APP_KEY;
    const SECRET_KEY = process.env.PLAYTIME_SECRET_KEY; // Your Value: Y90QOOQDWHDWI7XM3Z7WNIOYIEOTCO

    // Early fallback check if environment variables are missing on Vercel
    if (!APP_KEY || !SECRET_KEY) {
      console.error("❌ Error: PLAYTIME_APP_KEY or PLAYTIME_SECRET_KEY is missing in Vercel environment variables.");
      return NextResponse.json({ error: 'Server configuration mismatch' }, { status: 500 });
    }

    // 3. Reconstruct the signature following the Playtime SDK documentation rule:
    // sha1(userId + offerId + event + APP_KEY + SECRET_KEY)
    const dataToHash = `${userId}${offerId}${event}${APP_KEY}${SECRET_KEY}`;
    const calculatedSignature = crypto.createHash('sha1').update(dataToHash).digest('hex');

    // 4. Validate signature authenticity
    if (signature !== calculatedSignature) {
      console.warn(`⚠️ Security Mismatch! Received: ${signature} | Calculated: ${calculatedSignature}`);
      return NextResponse.json({ error: 'Invalid signature authentication' }, { status: 401 });
    }

    // =======================================================
    // 💰 [ YOUR BACKEND LOGIC HERE ]
    // Credit the points to the user inside your database (Appwrite/Firebase)
    // User ID is in: userId
    // Points amount to add is in: amount
    // =======================================================

    console.log(`✅ Success: Validated postback. Crediting ${amount} points to user ${userId}`);

    // 5. Send a 200 OK success response back to Playtime servers
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Postback Runtime Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
