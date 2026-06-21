import { NextRequest, NextResponse } from "next/server";
import { verify } from "otplib";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: "userId and code are required", valid: false },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found", valid: false },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    if (!userData?.twoFactorEnabled || !userData?.twoFactorSecret) {
      // 2FA is not actually enabled — treat as a pass-through so the user is
      // never locked out if their secret was lost or never stored.
      return NextResponse.json({ valid: true });
    }

    // otplib v13 `verify` is async and returns { valid, delta }.
    // Await it and read `.valid`. Allow a 30s clock-skew window.
    const result = await verify({
      token: String(code).trim(),
      secret: String(userData.twoFactorSecret).trim(),
      strategy: "totp",
      digits: 6,
      period: 30,
      epochTolerance: 30,
    });

    if (!result.valid) {
      return NextResponse.json(
        { error: "Invalid verification code", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[v0] 2FA login verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code", valid: false },
      { status: 500 }
    );
  }
}
