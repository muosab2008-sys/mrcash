import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing verification token." }, { status: 400 });
    }

    const snap = await adminDb
      .collection("users")
      .where("verificationToken", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "This verification link is invalid or has already been used." },
        { status: 400 },
      );
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();

    if (data.emailVerified) {
      return NextResponse.json({ success: true, message: "Email already verified." });
    }

    const expiry = Number(data.tokenExpiry) || 0;
    if (Date.now() > expiry) {
      return NextResponse.json(
        { error: "This verification link has expired. Please register again." },
        { status: 410 },
      );
    }

    await docSnap.ref.update({
      emailVerified: true,
      verificationToken: FieldValue.delete(),
      tokenExpiry: FieldValue.delete(),
      verifiedAt: FieldValue.serverTimestamp(),
    });

    // Reflect verification in Firebase Auth as well.
    try {
      await adminAuth.updateUser(docSnap.id, { emailVerified: true });
    } catch (authErr) {
      console.error("[verify-token] auth flag update failed:", authErr);
    }

    console.log(`[verify-token] verified user ${docSnap.id}`);
    return NextResponse.json({ success: true, message: "Email verified successfully." });
  } catch (err) {
    console.error("[verify-token] unexpected error:", err);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
