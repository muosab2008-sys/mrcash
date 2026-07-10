import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { isValidPassword } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is missing." }, { status: 400 });
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters (English letters, numbers, and symbols only)." },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data();

    const expiry = Number(data.resetPasswordExpiry || 0);
    if (!expiry || Date.now() > expiry) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Update the password in Firebase Auth.
    try {
      await adminAuth.updateUser(userDoc.id, { password: newPassword });
    } catch (err: any) {
      console.error("[v0] reset-password-confirm: updateUser failed:", err?.message || err);
      return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
    }

    // Clear the recovery tokens in Firestore.
    await userDoc.ref.update({
      resetPasswordToken: FieldValue.delete(),
      resetPasswordExpiry: FieldValue.delete(),
      passwordUpdatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[v0] reset-password-confirm: password updated for ${userDoc.id}`);
    return NextResponse.json({ success: true, message: "Your password has been updated." });
  } catch (error: any) {
    console.error("[v0] reset-password-confirm error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
