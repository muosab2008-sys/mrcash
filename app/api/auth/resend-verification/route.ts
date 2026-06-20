import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendCustomEmail, brandedEmail } from "@/lib/email";
import { generateSecureToken, isValidEmail } from "@/lib/validation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mrcash.app";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const snap = await adminDb
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    // Always return success to avoid leaking which emails exist.
    if (snap.empty) {
      return NextResponse.json({ success: true, message: "If that account exists, a new link is on its way." });
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data();

    if (data.emailVerified) {
      return NextResponse.json({ success: true, message: "This account is already verified. You can sign in." });
    }

    const verificationToken = generateSecureToken();
    const tokenExpiry = Date.now() + TOKEN_TTL_MS;

    await userDoc.ref.update({ verificationToken, tokenExpiry });

    const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
    await sendCustomEmail(
      normalizedEmail,
      "Verify your MrCash account",
      `Verify your email: ${verifyUrl}`,
      brandedEmail({
        heading: `Hi ${data.username || "there"}!`,
        body: "Here is your new verification link. Please confirm your email address to activate your account. This link expires in 24 hours.",
        buttonLabel: "Verify Email Address",
        buttonUrl: verifyUrl,
        footerNote: "If you didn't request this, you can safely ignore this email.",
      })
    );

    return NextResponse.json({ success: true, message: "A new verification link has been sent." });
  } catch (error: any) {
    console.error("[v0] resend-verification error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
