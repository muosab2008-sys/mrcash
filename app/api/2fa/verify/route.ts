import { NextRequest, NextResponse } from "next/server";
import { verifyTotpCode } from "@/lib/totp";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, secret, code } = await request.json();

    if (!userId || !secret || !code) {
      return NextResponse.json(
        { error: "userId, secret, and code are required" },
        { status: 400 }
      );
    }

    // Verify the TOTP code (async, with clock-drift tolerance)
    const isValid = await verifyTotpCode(secret, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Update user document in Firestore to enable 2FA
    await adminDb.collection("users").doc(userId).update({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
