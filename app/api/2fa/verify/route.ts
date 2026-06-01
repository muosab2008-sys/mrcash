import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { adminDb } from "@/lib/firebase-admin";

// Configure TOTP with a wider time window to handle clock drift
authenticator.options = {
  window: 2, // Allow codes from 2 steps before and after current time (2 minutes tolerance)
  step: 30, // Standard 30-second step
};

export async function POST(request: NextRequest) {
  try {
    const { userId, secret, code } = await request.json();

    if (!userId || !secret || !code) {
      return NextResponse.json(
        { error: "userId, secret, and code are required" },
        { status: 400 }
      );
    }

    // Verify the TOTP code with window tolerance for clock synchronization issues
    const isValid = authenticator.verify({
      token: code,
      secret: secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again or check your device time settings." },
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
