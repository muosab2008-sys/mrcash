import { NextRequest, NextResponse } from "next/server";
import { verify } from "otplib";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId, secret, code } = await request.json();

    if (!userId || !secret || !code) {
      return NextResponse.json(
        { error: "userId, secret, and code are required" },
        { status: 400 }
      );
    }

    // IMPORTANT: otplib v13 `verify` is ASYNC and returns { valid, delta }.
    // The previous code did `const isValid = verify(...)` (no await) and
    // treated the Promise as a boolean, which is why 2FA never worked.
    // We also allow a small clock-skew window so valid codes generated near a
    // 30s boundary are not falsely rejected (a common lock-out cause).
    const result = await verify({
      token: String(code).trim(),
      secret: String(secret).trim(),
      strategy: "totp",
      digits: 6,
      period: 30,
      epochTolerance: 30, // accept the previous/next 30s step
    });

    if (!result.valid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Persist the verified secret and enable 2FA for the user.
    await adminDb.collection("users").doc(userId).update({
      twoFactorEnabled: true,
      twoFactorSecret: String(secret).trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] 2FA enable verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
