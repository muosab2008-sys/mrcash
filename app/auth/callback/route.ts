import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
      if (ip && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const geoResponse = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { cache: 'no-store' })
          const geo = await geoResponse.json() as { country_name?: string; country_code?: string }
          const admin = createAdminClient()
          await admin.from('profiles').upsert({ id: data.user.id, email: data.user.email ?? '', username: data.user.user_metadata?.username ?? data.user.email?.split('@')[0] ?? 'User', ip_address: ip, country: geo.country_name ?? null, country_code: geo.country_code ?? null }, { onConflict: 'id' })
        } catch {
          // Authentication should still succeed when geolocation is unavailable.
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
