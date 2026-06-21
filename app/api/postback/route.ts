import { type NextRequest, NextResponse } from "next/server"
import {
  getAdminDb,
  processPostback,
  getSearchParam,
  parseFloatSafe,
  USD_TO_POINTS,
} from "@/lib/postback-utils"

export const dynamic = "force-dynamic"

/**
 * Generic / catch-all postback handler.
 *
 * Credentials are loaded from environment variables via getAdminDb() — no
 * secrets are ever embedded in source. Every conversion records the
 * offerwall company, offer name and the completing IP address for the
 * anti-fraud Host Log.
 */
export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const { searchParams } = new URL(request.url)

    // --- 1. Flexible user identification ---
    const userId = getSearchParam(searchParams, [
      "user_id",
      "s1",
      "sub1",
      "uid",
      "subId",
      "click_id",
      "external_id",
    ])
    if (!userId) return new NextResponse("ok", { status: 200 })

    // --- 2. Flexible payout parsing (USD -> internal points) ---
    const rawValue = getSearchParam(searchParams, [
      "payout_usd",
      "payout",
      "amount",
      "value",
      "reward",
      "usd",
      "revenue",
    ])
    const usdAmount = parseFloatSafe(rawValue)
    if (usdAmount <= 0) return new NextResponse("ok", { status: 200 })
    const points = Math.round(usdAmount * USD_TO_POINTS)

    // --- 3. Offerwall company + offer name (for the Host Log) ---
    const offerwall =
      getSearchParam(searchParams, ["wall", "source", "network", "offerwall"]) || "Offerwall"
    const offerName =
      getSearchParam(searchParams, ["offer_name", "off_name", "ad_name", "campaign"]) || "Task"

    // --- 4. Offer-completion IP.
    // Postbacks are server-to-server, so the request IP is the offerwall's
    // server, NOT the user. We therefore only trust the user_ip macro that
    // the offerwall fills with the real completing user's IP. ---
    const userIp =
      getSearchParam(searchParams, ["user_ip", "ip", "ip_address", "userip"]) || ""
    const country = getSearchParam(searchParams, ["country", "country_code", "geo"]) || undefined

    // --- 5. Duplicate-safe transaction id ---
    const transactionId =
      getSearchParam(searchParams, [
        "signature",
        "token",
        "txid",
        "transaction_id",
        "tid",
      ]) || `auto_${userId}_${Date.now()}`

    const result = await processPostback(adminDb, {
      userId,
      transactionId,
      offerwall,
      offerName,
      points,
      amountUSD: usdAmount,
      userIp,
      country,
      isChargeback: false,
    })

    if (!result.success) {
      console.error("[v0] generic postback failed:", result.message)
    }

    return new NextResponse("ok", { status: 200 })
  } catch (err) {
    console.error("[v0] Postback Error:", err)
    return new NextResponse("ok", { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
