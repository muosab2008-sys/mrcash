import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { code?: string }
  const code = body.code?.trim().toUpperCase()
  if (!code || !/^[A-Z0-9_-]{1,32}$/.test(code)) return NextResponse.json({ error: "Invalid promo code" }, { status: 400 })

  const admin = createAdminClient()
  const { data: promo, error } = await admin.from("promo_codes").select("id,code,reward_mc,max_uses,current_uses,is_active,expires_at").eq("code", code).maybeSingle()
  if (error || !promo || !promo.is_active || (promo.expires_at && new Date(promo.expires_at) <= new Date()) || (promo.max_uses !== null && promo.current_uses >= promo.max_uses)) return NextResponse.json({ error: "Invalid or unavailable promo code" }, { status: 400 })

  const { data: existing } = await admin.from("promo_code_redemptions").select("id").eq("promo_code_id", promo.id).eq("user_id", user.id).maybeSingle()
  if (existing) return NextResponse.json({ error: "You have already used this code" }, { status: 409 })

  const { data: profile } = await admin.from("profiles").select("mc,balance").eq("id", user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  const reward = Number(promo.reward_mc ?? 0)
  const { error: updateError } = await admin.from("profiles").update({ mc: Number(profile.mc ?? 0) + reward, balance: Number(profile.balance ?? 0) + reward / 1000 }).eq("id", user.id)
  if (updateError) return NextResponse.json({ error: "Unable to redeem code" }, { status: 500 })

  const { error: redemptionError } = await admin.from("promo_code_redemptions").insert({ promo_code_id: promo.id, user_id: user.id })
  if (redemptionError) return NextResponse.json({ error: "Unable to redeem code" }, { status: 500 })
  await admin.from("promo_codes").update({ current_uses: Number(promo.current_uses ?? 0) + 1 }).eq("id", promo.id)
  return NextResponse.json({ reward_mc: reward })
}
