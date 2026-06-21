import { NextRequest, NextResponse } from "next/server"
import { verify } from "otplib"
import { adminDb } from "@/lib/firebase-admin"

// Normalize a user-entered code: strip spaces and non-digits.
function normalizeCode(raw: unknown): string {
  return String(raw ?? "").replace(/\D/g, "").trim()
}

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json()

    const cleanCode = normalizeCode(code)

    if (!userId || cleanCode.length !== 6) {
      return NextResponse.json(
        { error: "A valid 6-digit code is required", valid: false },
        { status: 400 },
      )
    }

    // Get user's 2FA secret from Firestore (admin SDK bypasses client rules)
    const userDoc = await adminDb.collection("users").doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found", valid: false }, { status: 404 })
    }

    const userData = userDoc.data()

    if (!userData?.twoFactorEnabled || !userData?.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not enabled for this user", valid: false },
        { status: 400 },
      )
    }

    // CRITICAL: otplib v13 `verify` is asynchronous and resolves to
    // { valid, delta }. The previous code used it synchronously, so the
    // returned Promise was always truthy and the check never actually ran.
    // We also allow +/- 1 time step (30s) of drift so a code typed near a
    // window boundary or with minor device clock skew is not falsely rejected.
    const result = await verify({
      token: cleanCode,
      secret: userData.twoFactorSecret,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      epochTolerance: 30,
    })

    if (!result.valid) {
      return NextResponse.json(
        { error: "Invalid verification code", valid: false },
        { status: 400 },
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("[2fa] login verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify 2FA code", valid: false },
      { status: 500 },
    )
  }
}
