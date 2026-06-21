import type { NextRequest } from "next/server"

/**
 * Extracts the best-guess client IP address from an incoming request.
 * Works behind Vercel's edge / proxy layers by reading the standard
 * forwarding headers in priority order.
 */
export function getClientIp(request: NextRequest): string {
  const headers = request.headers

  // Vercel sets x-forwarded-for; the first entry is the real client IP.
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return normalizeIp(first)
  }

  const realIp = headers.get("x-real-ip")
  if (realIp) return normalizeIp(realIp.trim())

  const vercelIp = headers.get("x-vercel-forwarded-for")
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim()
    if (first) return normalizeIp(first)
  }

  return "0.0.0.0"
}

/** Reads an explicit IP from postback query params, falling back to the request IP. */
export function getOfferIp(paramIp: string | null | undefined, request: NextRequest): string {
  if (paramIp && paramIp.trim() && paramIp.trim() !== "0.0.0.0") {
    return normalizeIp(paramIp.trim())
  }
  return getClientIp(request)
}

/** Normalizes IPv6-mapped IPv4 addresses (::ffff:1.2.3.4 -> 1.2.3.4). */
export function normalizeIp(ip: string): string {
  if (ip.startsWith("::ffff:")) return ip.slice(7)
  return ip
}
