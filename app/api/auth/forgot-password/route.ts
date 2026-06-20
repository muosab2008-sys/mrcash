import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { sendPasswordResetEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/security";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mrcash.app";
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// Generic response prevents account enumeration.
const GENERIC_OK = {
  success: true,
  message: "If an account exists for that email, a password reset link is on its way.",
};

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalized = (email || "").trim().toLowerCase();

    if (!normalized || !isValidEmail(normalized)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const snapshot = await adminDb.collection("users").where("email", "==", normalized).limit(1).get();

    // Always return the same response regardless of existence.
    if (snapshot.empty) {
      console.log(`[v0] forgot-password: no account for ${normalized}`);
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    const userDoc = snapshot.docs[0];
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + RESET_TTL_MS;

    await userDoc.ref.update({ resetPasswordToken, resetTokenExpiry });

    const resetUrl = `${APP_URL}/reset-password?token=${resetPasswordToken}`;
    const username = userDoc.data().username || "there";

    try {
      await sendPasswordResetEmail(normalized, username, resetUrl);
    } catch (mailErr: any) {
      console.error("[v0] forgot-password: email send failed:", mailErr?.message);
      return NextResponse.json({ error: "We couldn't send the reset email. Please try again shortly." }, { status: 502 });
    }

    console.log(`[v0] forgot-password: reset email dispatched for ${userDoc.id}`);
    return NextResponse.json(GENERIC_OK, { status: 200 });
  } catch (err: any) {
    console.error("[v0] forgot-password: unexpected error:", err?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
