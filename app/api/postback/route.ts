import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

function value(params: URLSearchParams, body: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const candidate = params.get(key) ?? body[key]
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) return String(candidate).trim()
  }
  return ""
}

async function parseBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try { return await request.json() as Record<string, unknown> } catch { return {} }
  }
  try {
    const form = await request.formData()
    return Object.fromEntries(form.entries()) as Record<string, unknown>
  } catch { return {} }
}

async function handlePostback(request: NextRequest) {
  const params = new URL(request.url).searchParams
  const body = await parseBody(request)
  const userId = value(params, body, ["userId", "user_id", "subId", "uid"])
  const secret = value(params, body, ["secret", "api_key", "key", "token"])
  const offerName = value(params, body, ["offerName", "offer_name", "ad_name"]) || "Offer"
  const source = value(params, body, ["company", "source", "network"]) || "Unknown"
  const amount = Number(value(params, body, ["amount", "points", "payout", "reward", "currency"]))
  const configuredSecret = process.env.POSTBACK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY_2

  if (!configuredSecret || secret !== configuredSecret || !userId || !Number.isFinite(amount) || amount <= 0) {
    return new NextResponse("0", { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin.from("profiles").select("id,mc,balance").eq("id", userId).maybeSingle()
  if (profileError || !profile) return new NextResponse("0", { status: 404 })

  const { error: updateError } = await admin.from("profiles").update({ mc: Number(profile.mc ?? 0) + amount, balance: Number(profile.balance ?? 0) + amount / 1000 }).eq("id", userId)
  if (updateError) return new NextResponse("0", { status: 500 })

  const { error: transactionError } = await admin.from("transactions").insert({ user_id: userId, offer_id: value(params, body, ["offerId", "offer_id"]) || null, offer_name: offerName, amount, type: "offer", status: "completed" })
  if (transactionError) return new NextResponse("0", { status: 500 })

  await admin.from("notifications").insert({ user_id: userId, title: "Points Credited", message: `You earned ${amount.toLocaleString()} MC from ${offerName} (${source}).`, type: "offer_credit", read: false })
  return new NextResponse("1", { status: 200 })
}

export async function GET(request: NextRequest) { return handlePostback(request) }
export async function POST(request: NextRequest) { return handlePostback(request) }
