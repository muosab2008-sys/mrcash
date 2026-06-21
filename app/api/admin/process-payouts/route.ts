import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminDb, adminAuth } from "@/lib/firebase-admin"

const FAUCETPAY_SEND_URL = "https://faucetpay.io/api/v1/send"

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") || ""
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!idToken) return null
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get()
    if (!userSnap.exists || !userSnap.data()?.isAdmin) return null
    return decoded.uid
  } catch {
    return null
  }
}

interface PayoutResult {
  id: string
  username: string
  amountUSD: number
  status: "completed" | "failed"
  message: string
}

/**
 * Semi-automated mass payout. Loops over every withdrawal with status
 * "approved", fires the FaucetPay send API for each, and marks the request
 * "completed" (or "failed" with the error message) in Firestore.
 */
export async function POST(request: NextRequest) {
  const adminUid = await requireAdmin(request)
  if (!adminUid) {
    return NextResponse.json({ error: "Admin authorization required" }, { status: 401 })
  }

  const apiKey = process.env.FAUCETPAY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "FAUCETPAY_API_KEY is not configured on the server" },
      { status: 500 },
    )
  }

  const approvedSnap = await adminDb
    .collection("withdrawals")
    .where("status", "==", "approved")
    .get()

  if (approvedSnap.empty) {
    return NextResponse.json({ success: true, processed: 0, results: [] })
  }

  const results: PayoutResult[] = []

  for (const docSnap of approvedSnap.docs) {
    const w = docSnap.data()
    const amountUSD = Number(w.amountUSD || 0)
    // Currency the user chose to receive (FaucetPay ticker). Default to USDT.
    const currency = (w.currency || w.coin || "USDT").toString().toUpperCase()
    const to = (w.paymentDetails || w.faucetpayAddress || "").toString().trim()

    if (!to || amountUSD <= 0) {
      await docSnap.ref.update({
        status: "failed",
        failReason: "Missing payout address or invalid amount",
        processedAt: FieldValue.serverTimestamp(),
      })
      results.push({
        id: docSnap.id,
        username: w.username || w.userId,
        amountUSD,
        status: "failed",
        message: "Missing payout address or invalid amount",
      })
      continue
    }

    try {
      const body = new URLSearchParams({
        api_key: apiKey,
        amount: amountUSD.toFixed(2),
        to,
        currency,
        // FaucetPay treats the amount as a USD value when referral/usd flag is set.
        referral: "0",
      })

      const res = await fetch(FAUCETPAY_SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })

      const data = await res.json().catch(() => ({}))
      const ok = res.ok && (data.status === 200 || data.success === true)

      if (ok) {
        await docSnap.ref.update({
          status: "completed",
          processedAt: FieldValue.serverTimestamp(),
          payoutProvider: "faucetpay",
          payoutResponse: data,
          payoutId: data.payout_id || data.id || null,
          processedBy: adminUid,
        })
        results.push({
          id: docSnap.id,
          username: w.username || w.userId,
          amountUSD,
          status: "completed",
          message: data.message || "Sent",
        })
      } else {
        await docSnap.ref.update({
          status: "failed",
          failReason: data.message || `FaucetPay error (${res.status})`,
          payoutResponse: data,
          processedAt: FieldValue.serverTimestamp(),
        })
        results.push({
          id: docSnap.id,
          username: w.username || w.userId,
          amountUSD,
          status: "failed",
          message: data.message || `FaucetPay error (${res.status})`,
        })
      }
    } catch (err: any) {
      await docSnap.ref.update({
        status: "failed",
        failReason: err?.message || "Network error",
        processedAt: FieldValue.serverTimestamp(),
      })
      results.push({
        id: docSnap.id,
        username: w.username || w.userId,
        amountUSD,
        status: "failed",
        message: err?.message || "Network error",
      })
    }
  }

  const completed = results.filter((r) => r.status === "completed").length
  return NextResponse.json({
    success: true,
    processed: results.length,
    completed,
    failed: results.length - completed,
    results,
  })
}
