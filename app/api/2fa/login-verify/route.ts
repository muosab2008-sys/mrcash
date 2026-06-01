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

    // Verify the TOTP code with window tolerance for clock synchronization issues
    const isValid = authenticator.verify({
      token: code,
      secret: userData.twoFactorSecret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your authenticator app and device time settings.", valid: false },
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
