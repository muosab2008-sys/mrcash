import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { buildHostLog } from "@/lib/fraud-utils"

export const dynamic = "force-dynamic"

/**
 * Admin-only fraud check for any user. Verifies the caller's ID token AND
 * that the caller is flagged as an admin in Firestore before returning the
 * target user's Host Log + fraud flags.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const idToken: string | undefined = body.idToken
    const targetUserId: string | undefined = body.userId

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 401 })
    }
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const callerSnap = await adminDb.collection("users").doc(decoded.uid).get()
    if (!callerSnap.exists || !callerSnap.data()?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await buildHostLog(adminDb, targetUserId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[v0] admin fraud-check error:", error)
    return NextResponse.json({ error: "Failed to run fraud check" }, { status: 500 })
  }
}
