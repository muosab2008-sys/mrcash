import { NextRequest, NextResponse } from "next/server";
import { verifyTotpCode } from "@/lib/totp";
import { adminDb } from "@/lib/firebase-admin";

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

    // Verify the TOTP code (async, with clock-drift tolerance)
    const isValid = await verifyTotpCode(userData.twoFactorSecret, code);

    if (!isValid) {
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
