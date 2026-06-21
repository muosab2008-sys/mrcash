import type { NextRequest } from "next/server"

/**
 * Best-effort extraction of the real client IP behind Vercel's proxy.
 * x-forwarded-for may contain a comma-separated list; the first entry is the client.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}

export interface DeviceInfo {
  browser: string
  os: string
  deviceType: "Mobile" | "Tablet" | "Desktop"
  raw: string
}

/**
 * Lightweight User-Agent parser (no external dependency) good enough to label
 * an active session with a readable browser / OS / device type.
 */
export function parseUserAgent(ua: string | null): DeviceInfo {
  const raw = ua || "unknown"
  const s = raw.toLowerCase()

  let browser = "Unknown browser"
  if (s.includes("edg/")) browser = "Edge"
  else if (s.includes("opr/") || s.includes("opera")) browser = "Opera"
  else if (s.includes("samsungbrowser")) browser = "Samsung Internet"
  else if (s.includes("chrome") && !s.includes("chromium")) browser = "Chrome"
  else if (s.includes("firefox")) browser = "Firefox"
  else if (s.includes("safari") && !s.includes("chrome")) browser = "Safari"

  let os = "Unknown OS"
  if (s.includes("windows")) os = "Windows"
  else if (s.includes("android")) os = "Android"
  else if (s.includes("iphone") || s.includes("ipad") || s.includes("ipod")) os = "iOS"
  else if (s.includes("mac os") || s.includes("macintosh")) os = "macOS"
  else if (s.includes("linux")) os = "Linux"

  let deviceType: DeviceInfo["deviceType"] = "Desktop"
  if (s.includes("ipad") || s.includes("tablet")) deviceType = "Tablet"
  else if (s.includes("mobi") || s.includes("iphone") || s.includes("android")) deviceType = "Mobile"

  return { browser, os, deviceType, raw }
}

/**
 * Stable session id derived from device + IP so repeated logins from the same
 * device update one record instead of creating endless duplicates.
 */
export function buildSessionId(uid: string, info: DeviceInfo, ip: string): string {
  const base = `${info.browser}|${info.os}|${info.deviceType}|${ip}`
  // simple deterministic hash
  let hash = 0
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i)
    hash |= 0
  }
  return `${Math.abs(hash).toString(36)}`
}
