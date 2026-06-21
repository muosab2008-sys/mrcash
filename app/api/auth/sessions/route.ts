import { NextRequest, NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/lib/firebase-admin"

async function getUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") || ""
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!idToken) return null
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    return decoded.uid
  } catch {
    return null
  }
}

// List the active sessions for the authenticated user.
export async function GET(request: NextRequest) {
  const uid = await getUid(request)
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const snap = await adminDb
    .collection("users")
    .doc(uid)
    .collection("sessions")
    .orderBy("lastActive", "desc")
    .get()

  const sessions = snap.docs.map((d) => {
    const data = d.data()
    return {
      sessionId: d.id,
      browser: data.browser || "Unknown",
      os: data.os || "Unknown",
      deviceType: data.deviceType || "Desktop",
      ip: data.ip || "unknown",
      revoked: data.revoked || false,
      lastActive: data.lastActive?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    }
  })

  return NextResponse.json({ sessions })
}

/**
 * Revoke sessions.
 * Body: { sessionId } to remove one device, or { all: true } to log out every
 * OTHER device. Revoking other devices invalidates their refresh tokens so they
 * are forced to re-authenticate; the current device keeps its active token.
 */
export async function DELETE(request: NextRequest) {
  const uid = await getUid(request)
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { sessionId, all, currentSessionId } = await request.json().catch(() => ({}))
  const sessionsRef = adminDb.collection("users").doc(uid).collection("sessions")

  if (all) {
    // Force re-auth everywhere, then clear all session records except current.
    await adminAuth.revokeRefreshTokens(uid)
    const snap = await sessionsRef.get()
    const batch = adminDb.batch()
    snap.docs.forEach((d) => {
      if (d.id !== currentSessionId) batch.delete(d.ref)
    })
    await batch.commit()
    return NextResponse.json({ success: true, revoked: "all-others" })
  }

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId or all is required" }, { status: 400 })
  }

  // Removing a specific device: drop its record and invalidate refresh tokens so
  // that device cannot continue once its short-lived ID token expires.
  await sessionsRef.doc(sessionId).delete()
  if (sessionId !== currentSessionId) {
    await adminAuth.revokeRefreshTokens(uid)
  }

  return NextResponse.json({ success: true, revoked: sessionId })
}
