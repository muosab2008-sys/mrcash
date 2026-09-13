import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: requester } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()
  if (!requester?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data, error } = await admin.from("profiles").select("id,email,username,full_name,photo_url,balance,mc,fragments,level,ip_address,country,country_code,is_admin,is_banned").order("email")
  if (error) return NextResponse.json({ error: "Unable to load users" }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}
