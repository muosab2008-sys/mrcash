import { NextRequest, NextResponse } from "next/server"
import { verify } from "otplib"
import { adminDb } from "@/lib/firebase-admin"

function normalizeCode(raw: unknown): string {
  return String(raw ?? "").replace(/\D/g, "").trim()
}

export async function POST(request: NextRequest) {
  try {
    const { userId, secret, code } = await request.json()

    const cleanCode = normalizeCode(code)

    if (!userId || !secret || cleanCode.length !== 6) {
      return NextResponse.json(
        { error: "userId, secret, and a valid 6-digit code are required" },
        { status: 400 },
      )
    }

    // otplib v13 `verify` is async and resolves to { valid, delta }.
    // Must be awaited; allow +/- 1 step (30s) clock drift.
    const result = await verify({
      token: cleanCode,
      secret,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      epochTolerance: 30,
    })

    if (!result.valid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    // Enable 2FA only after a genuinely valid code is confirmed.
    await adminDb.collection("users").doc(userId).update({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorEnabledAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[2fa] setup verification error:", error)
    return NextResponse.json({ error: "Failed to verify 2FA code" }, { status: 500 })
  }
}
