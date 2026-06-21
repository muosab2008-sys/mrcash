import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { buildHostLog } from "@/lib/fraud-utils"

export const dynamic = "force-dynamic"

/**
 * Returns the authenticated user's own withdrawal Host Log + fraud flags.
 * Requires a valid Firebase ID token; users can only read their own log.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const idToken: string | undefined = body.idToken

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const result = await buildHostLog(adminDb, decoded.uid)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[v0] host-log error:", error)
    return NextResponse.json({ error: "Failed to build host log" }, { status: 500 })
  }
}
