import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Verification token is missing." }, { status: 400 });
    }

    // Locate the user holding this verification token.
    const snap = await adminDb
      .collection("users")
      .where("verificationToken", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "This verification link is invalid or has already been used." },
        { status: 400 }
      );
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data();

    // Already verified — treat as a graceful success.
    if (data.emailVerified) {
      return NextResponse.json({ success: true, message: "Your email is already verified." });
    }

    // Check expiry.
    const expiry = Number(data.tokenExpiry || 0);
    if (!expiry || Date.now() > expiry) {
      return NextResponse.json(
        { error: "This verification link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Flip verified state and clear the tokens.
    await userDoc.ref.update({
      emailVerified: true,
      verificationToken: FieldValue.delete(),
      tokenExpiry: FieldValue.delete(),
      verifiedAt: FieldValue.serverTimestamp(),
    });

    // Keep Firebase Auth in sync.
    try {
      await adminAuth.updateUser(userDoc.id, { emailVerified: true });
    } catch (err: any) {
      console.error("[v0] verify-token: auth sync failed:", err?.message || err);
    }

    console.log(`[v0] verify-token: verified user ${userDoc.id}`);
    return NextResponse.json({ success: true, message: "Email verified successfully." });
  } catch (error: any) {
    console.error("[v0] verify-token error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
