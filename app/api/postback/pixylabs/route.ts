import { NextRequest, NextResponse } from "next/server";
import {
  getAdminDb,
  processPostback,
  USD_TO_POINTS,
  parseFloatSafe,
} from "@/lib/postback-utils";

/**
 * PixyLabs & Swaarm Postback Handler
 * * Support for PixyLabs Parameters:
 * - wall: Offerwall name
 * - user_id: User identifier
 * - payout_usd: Payout in USD
 * - points: Reward points
 * - transaction_id: Unique transaction ID
 */

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);

    // 1. Extract User ID (Supporting PixyLabs 'user_id' and Swaarm formats)
    const userId = 
      searchParams.get("user_id") || 
      searchParams.get("click_publisher_clickId") || 
      searchParams.get("click.publisher.clickId") ||
      searchParams.get("subId") ||
      "";
    
    // 2. Extract Transaction ID (Supporting PixyLabs 'transaction_id' and Swaarm formats)
    const transactionId = 
      searchParams.get("transaction_id") || 
      searchParams.get("id") || 
      searchParams.get("click_id") ||
      searchParams.get("click.id") ||
      "";
    
    // 3. Extract Offerwall Name
    const wallName = searchParams.get("wall") || "PixyLabs";

    // 4. Payout Extraction - Supporting multiple formats
    const payoutUsd = parseFloatSafe(
      searchParams.get("payout_usd") || 
      searchParams.get("payout_theyGetInDollars") || 
      searchParams.get("payout.theyGetInDollars") ||
      searchParams.get("payout")
    );
    
    const payoutCents = parseFloatSafe(
      searchParams.get("payout_theyGetInCents") || 
      searchParams.get("payout.theyGetInCents")
    );
    
    const incomingPoints = parseFloatSafe(
      searchParams.get("points") || 
      searchParams.get("payout_theyGetPoints") || 
      searchParams.get("payout.theyGetPoints")
    );

    // 5. Additional Metadata
    const offerId = 
      searchParams.get("offer_offerId") || 
      searchParams.get("offer.offerId") ||
      searchParams.get("offer_id") ||
      "";

    const offerName = 
      searchParams.get("offer_name") || 
      searchParams.get("offer.name") ||
      "Offer Reward";

    const status = (
      searchParams.get("status_state") || 
      searchParams.get("status.state") ||
      searchParams.get("status") ||
      "APPROVED"
    ).toUpperCase();

    const userIp = searchParams.get("click_user_connection_ip") || searchParams.get("ip") || "";
    const country = searchParams.get("click_user_geo_country") || searchParams.get("country") || "";

    // Validate required fields
    if (!userId || !transactionId) {
      console.warn("Missing userId or transactionId in postback");
      return new NextResponse("ok", { status: 200 });
    }

    const isChargeback = status === "REJECTED";

    // 6. Calculate Final Points
    let points = 0;
    let finalAmountUSD = 0;

    if (incomingPoints > 0) {
      points = Math.round(incomingPoints);
      finalAmountUSD = payoutUsd || (points / USD_TO_POINTS);
    } else if (payoutUsd > 0) {
      finalAmountUSD = payoutUsd;
      points = Math.round(finalAmountUSD * USD_TO_POINTS);
    } else if (payoutCents > 0) {
      finalAmountUSD = payoutCents / 100;
      points = Math.round(finalAmountUSD * USD_TO_POINTS);
    }

    // Skip if zero payout
    if (points === 0) {
      return new NextResponse("ok", { status: 200 });
    }

    // 7. Process in Firebase
    const result = await processPostback(adminDb, {
      userId,
      transactionId,
      offerwall: wallName,
      offerName,
      offerId,
      points,
      amountUSD: finalAmountUSD,
      userIp,
      country,
      isChargeback,
    });

    if (!result.success) {
      console.error(`${wallName} postback failed:`, result.message);
    }

    return new NextResponse("ok", { status: 200 });

  } catch (error) {
    console.error("Postback error:", error);
    return new NextResponse("ok", { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
