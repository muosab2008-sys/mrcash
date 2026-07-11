import type { NextRequest } from "next/server";

/**
 * Extracts the real client IP from an incoming postback request.
 * Advertising networks send their server IP, which we store per transaction
 * so the admin dashboard can group offers by the IP that received the points.
 */
export function getClientIp(req: NextRequest): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}
