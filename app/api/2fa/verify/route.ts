import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { adminDb } from "@/lib/firebase-admin";

// Configure authenticator with wider time window for better compatibility
authenticator.options = {
  window: 2, // Allow 2 steps before and after (2 minutes tolerance)
  step: 30, // 30 second steps
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

    // Clean the code - remove any spaces
    const cleanCode = code.toString().replace(/\s/g, "");

    // Verify the TOTP code with wider time window
    const isValid = authenticator.check(cleanCode, secret);

    if (!isValid) {
      console.log("[v0] 2FA setup verification failed for user:", userId);
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
