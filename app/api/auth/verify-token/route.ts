import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Verification token is missing." }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection("users")
      .where("verificationToken", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "This verification link is invalid or has already been used." }, { status: 400 });
    }

    const userDoc = snapshot.docs[0];
    const data = userDoc.data();

    if (data.emailVerified) {
      return NextResponse.json({ success: true, message: "Your email is already verified." }, { status: 200 });
    }

    const expiry = Number(data.tokenExpiry) || 0;
    if (!expiry || Date.now() > expiry) {
      return NextResponse.json(
        { error: "This verification link has expired. Please register again or request a new link." },
        { status: 410 }
      );
    }

    // Flip verified + clear tokens (Firestore and Auth record stay in sync).
    await userDoc.ref.update({
      emailVerified: true,
      verificationToken: FieldValue.delete(),
      tokenExpiry: FieldValue.delete(),
      verifiedAt: FieldValue.serverTimestamp(),
    });

    await adminAuth.updateUser(userDoc.id, { emailVerified: true }).catch((e) => {
      console.error("[v0] verify-token: adminAuth update failed:", e?.message);
    });

    console.log(`[v0] verify-token: verified user ${userDoc.id}.`);

    return NextResponse.json({ success: true, message: "Email verified successfully." }, { status: 200 });
  } catch (err: any) {
    console.error("[v0] verify-token: unexpected error:", err?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
