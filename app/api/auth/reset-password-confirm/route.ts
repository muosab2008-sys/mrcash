import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isValidPassword } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = (await req.json()) as {
      token?: string;
      newPassword?: string;
    };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    }
    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { error: "Password must be at least 6 English letters/numbers/symbols." },
        { status: 400 },
      );
    }

    const snap = await adminDb
      .collection("users")
      .where("resetPasswordToken", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "This reset link is invalid or has already been used." },
        { status: 400 },
      );
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();
    const expiry = Number(data.resetTokenExpiry) || 0;

    if (Date.now() > expiry) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 410 },
      );
    }

    // Update the password through the Admin SDK.
    await adminAuth.updateUser(docSnap.id, { password: newPassword as string });

    // Clear the recovery tokens.
    await docSnap.ref.update({
      resetPasswordToken: FieldValue.delete(),
      resetTokenExpiry: FieldValue.delete(),
      passwordChangedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[reset-password-confirm] password updated for ${docSnap.id}`);
    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("[reset-password-confirm] unexpected error:", err);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
