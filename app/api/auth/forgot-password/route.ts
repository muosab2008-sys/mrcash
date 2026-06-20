import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendCustomEmail, renderEmailTemplate } from "@/lib/email";
import { isValidEmail, generateSecureToken } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = "https://mrcash.app";
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// Neutral response avoids account-enumeration leaks.
const NEUTRAL = {
  success: true,
  message: "If an account exists for that email, a reset link has been sent.",
};

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalized = email?.trim().toLowerCase();

    if (!normalized || !isValidEmail(normalized)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const snap = await adminDb
      .collection("users")
      .where("email", "==", normalized)
      .limit(1)
      .get();

    if (snap.empty) {
      // Do not reveal whether the account exists.
      console.log(`[forgot-password] no account for ${normalized}`);
      return NextResponse.json(NEUTRAL);
    }

    const docSnap = snap.docs[0];
    const resetPasswordToken = generateSecureToken();
    const resetTokenExpiry = Date.now() + RESET_TTL_MS;

    await docSnap.ref.update({ resetPasswordToken, resetTokenExpiry });

    const resetUrl = `${APP_URL}/reset-password?token=${resetPasswordToken}`;
    const html = renderEmailTemplate({
      heading: "Reset your password",
      intro:
        "We received a request to reset your MrCash password. Click the button below to choose a new one. This link expires in 1 hour.",
      buttonLabel: "Reset Password",
      buttonUrl: resetUrl,
      footnote: "If you didn't request this, you can safely ignore this email — your password stays the same.",
    });
    const text = `Reset your MrCash password: ${resetUrl} (expires in 1 hour)`;

    await sendCustomEmail(normalized, "Reset your MrCash password", text, html);
    console.log(`[forgot-password] reset link sent to ${normalized}`);

    return NextResponse.json(NEUTRAL);
  } catch (err) {
    console.error("[forgot-password] unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
