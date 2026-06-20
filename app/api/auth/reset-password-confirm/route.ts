import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { isValidPassword } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = (await req.json()) as { token?: string; newPassword?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Reset token is missing." }, { status: 400 });
    }
    if (!isValidPassword(newPassword || "")) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters and contain only English letters, numbers, or basic symbols." },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection("users")
      .where("resetPasswordToken", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "This reset link is invalid or has already been used." }, { status: 400 });
    }

    const userDoc = snapshot.docs[0];
    const data = userDoc.data();
    const expiry = Number(data.resetTokenExpiry) || 0;

    if (!expiry || Date.now() > expiry) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 410 });
    }

    // Update the credential via Admin Auth, then clear the recovery tokens.
    await adminAuth.updateUser(userDoc.id, { password: newPassword });

    await userDoc.ref.update({
      resetPasswordToken: FieldValue.delete(),
      resetTokenExpiry: FieldValue.delete(),
      passwordUpdatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[v0] reset-password-confirm: password updated for ${userDoc.id}`);
    return NextResponse.json({ success: true, message: "Your password has been updated." }, { status: 200 });
  } catch (err: any) {
    console.error("[v0] reset-password-confirm: unexpected error:", err?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
