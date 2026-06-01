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
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: "userId and code are required" },
        { status: 400 }
      );
    }

    // Get user's 2FA secret from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    if (!userData?.twoFactorEnabled || !userData?.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not enabled for this user" },
        { status: 400 }
      );
    }

    // Clean the code - remove any spaces
    const cleanCode = code.toString().replace(/\s/g, "");

    // Verify the TOTP code with wider time window
    const isValid = authenticator.check(cleanCode, userData.twoFactorSecret);

    if (!isValid) {
      console.log("[v0] 2FA verification failed for user:", userId);
      return NextResponse.json(
        { error: "Invalid verification code", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("2FA login verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
