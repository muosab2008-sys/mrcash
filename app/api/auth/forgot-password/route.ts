import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendCustomEmail, brandedEmail } from "@/lib/email";
import { isValidEmail, generateSecureToken, getBaseUrl } from "@/lib/validation";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// Generic response so we never reveal whether an email is registered.
const GENERIC_OK = {
  success: true,
  message: "If an account exists for that email, a reset link has been sent.",
};

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

    // Always return the same response regardless of existence.
    if (snap.empty) {
      console.log(`[v0] forgot-password: no account for ${normalizedEmail}`);
      return NextResponse.json(GENERIC_OK);
    }

    const userDoc = snap.docs[0];
    const resetPasswordToken = generateSecureToken();
    const resetPasswordExpiry = Date.now() + RESET_TTL_MS;

    await userDoc.ref.update({ resetPasswordToken, resetPasswordExpiry });

    const resetUrl = `${getBaseUrl(request.headers)}/reset-password?token=${resetPasswordToken}`;
    await sendCustomEmail(
      normalizedEmail,
      "Reset your MrCash password",
      `Reset your password: ${resetUrl}`,
      brandedEmail({
        heading: "Password Reset Request",
        body: "We received a request to reset your MrCash password. Click the button below to choose a new password. This link expires in 1 hour.",
        buttonLabel: "Reset Password",
        buttonUrl: resetUrl,
        footerNote: "If you didn't request a password reset, you can safely ignore this email.",
      })
    );

    console.log(`[v0] forgot-password: reset link sent to ${normalizedEmail}`);
    return NextResponse.json(GENERIC_OK);
  } catch (error: any) {
    console.error("[v0] forgot-password error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
