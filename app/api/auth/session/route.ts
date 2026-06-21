import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { getClientIp, parseUserAgent, buildSessionId } from "@/lib/request-utils"

/**
 * Records the current device/session and updates anti-fraud IP fields on the
 * user document. Called by the client right after a successful login/register.
 *
 * Auth: expects a Firebase ID token in the Authorization: Bearer <token> header.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!idToken) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const uid = decoded.uid

    const { event } = await request.json().catch(() => ({ event: "login" }))

    const ip = getClientIp(request)
    const device = parseUserAgent(request.headers.get("user-agent"))
    const sessionId = buildSessionId(uid, device, ip)
    const nowIso = new Date().toISOString()

    const userRef = adminDb.collection("users").doc(uid)
    const userSnap = await userRef.get()
    const userData = userSnap.data() || {}

    // Anti-fraud: persist registration IP once, always update the latest login IP.
    const userUpdate: Record<string, unknown> = {
      lastIp: ip,
      lastLoginAt: FieldValue.serverTimestamp(),
      lastDevice: `${device.browser} on ${device.os}`,
    }
    if (event === "register" || !userData.registrationIp) {
      userUpdate.registrationIp = userData.registrationIp || ip
    }
    // Track the set of known IPs (capped client-side display) for abuse review.
    userUpdate.knownIps = FieldValue.arrayUnion(ip)

    await userRef.set(userUpdate, { merge: true })

    // Upsert the active session record.
    await userRef
      .collection("sessions")
      .doc(sessionId)
      .set(
        {
          sessionId,
          browser: device.browser,
          os: device.os,
          deviceType: device.deviceType,
          userAgent: device.raw,
          ip,
          lastActive: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          revoked: false,
        },
        { merge: true },
      )

    return NextResponse.json({ success: true, sessionId, ip })
  } catch (error) {
    console.error("[auth] session log error:", error)
    return NextResponse.json({ error: "Failed to record session" }, { status: 500 })
  }
}
