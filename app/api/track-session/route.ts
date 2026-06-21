import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { recordSessionIp } from "@/lib/fraud-utils"
import { getClientIp } from "@/lib/ip-utils"

export const dynamic = "force-dynamic"

/**
 * Records the client's IP for a login / registration / oauth session.
 * The caller must supply a valid Firebase ID token so we can only ever
 * write the IP onto the authenticated user's own profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const idToken: string | undefined = body.idToken
    const type: "login" | "register" | "google" = body.type || "login"

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const uid = decoded.uid

    const ip = getClientIp(request)
    const userAgent = request.headers.get("user-agent") || undefined

    await recordSessionIp(adminDb, uid, ip, type, userAgent)

    return NextResponse.json({ success: true, ip })
  } catch (error) {
    console.error("[v0] track-session error:", error)
    return NextResponse.json({ error: "Failed to record session" }, { status: 500 })
  }
}
