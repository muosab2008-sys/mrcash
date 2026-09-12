import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function safeNextPath(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNextPath(url.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth_callback_missing_code', url.origin))
  }

  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session?.user) {
      return NextResponse.redirect(new URL('/login?error=oauth_callback_failed', url.origin))
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
    if (ip && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { cache: 'no-store' })
        const geo = await geoResponse.json() as { country_name?: string; country_code?: string }
        const admin = createAdminClient()
        await admin.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email ?? '',
          username: session.user.user_metadata?.username ?? session.user.email?.split('@')[0] ?? 'User',
          ip_address: ip,
          country: geo.country_name ?? null,
          country_code: geo.country_code ?? null,
        }, { onConflict: 'id' })
      } catch {
        // Profile enrichment is best effort and must never block authentication.
      }
    }

    return NextResponse.redirect(new URL(next, url.origin))
  } catch {
    return NextResponse.redirect(new URL('/login?error=oauth_callback_failed', url.origin))
  }
}
