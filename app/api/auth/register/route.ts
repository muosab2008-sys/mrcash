import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { sendVerificationEmail } from "@/lib/email";
import { getClientIp, isStrictAlphanumeric, isValidEmail, isValidPassword } from "@/lib/security";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mrcash.app";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RegisterBody {
  email?: string;
  username?: string;
  password?: string;
  fullName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterBody;
    const email = (body.email || "").trim().toLowerCase();
    const username = (body.username || "").trim();
    const fullName = (body.fullName || "").trim();
    const password = body.password || "";

    // 1) Strict input validation -------------------------------------------
    if (!email || !username || !fullName || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!isStrictAlphanumeric(username)) {
      return NextResponse.json(
        { error: "Username may only contain English letters and numbers (no spaces or symbols)." },
        { status: 400 }
      );
    }
    if (!isStrictAlphanumeric(fullName)) {
      return NextResponse.json(
        { error: "Full name may only contain English letters and numbers (no spaces or symbols)." },
        { status: 400 }
      );
    }
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters and contain only English letters, numbers, or basic symbols." },
        { status: 400 }
      );
    }

    // 2) Duplicate checks in Firestore -------------------------------------
    const usersRef = adminDb.collection("users");

    const [emailDup, usernameDup] = await Promise.all([
      usersRef.where("email", "==", email).limit(1).get(),
      usersRef.where("username", "==", username).limit(1).get(),
    ]);

    if (!emailDup.empty) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    if (!usernameDup.empty) {
      return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
    }

    // 3) Create the Firebase Auth user (server-side, unverified) ------------
    let uid: string;
    try {
      const authUser = await adminAuth.createUser({
        email,
        password,
        displayName: username,
        emailVerified: false,
      });
      uid = authUser.uid;
    } catch (authErr: any) {
      if (authErr?.code === "auth/email-already-exists") {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      console.error("[v0] register: createUser failed:", authErr?.message);
      return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
    }

    // 4) Persist profile with verification token + initial IP ---------------
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + TOKEN_TTL_MS;
    const ipAddress = getClientIp(req);

    await usersRef.doc(uid).set({
      uid,
      email,
      username,
      fullName,
      photoURL: null,
      points: 0,
      fragments: 0,
      level: 1,
      totalEarned: 0,
      referredBy: null,
      referralCode: uid,
      isAdmin: false,
      isBanned: false,
      twoFactorEnabled: false,
      emailVerified: false,
      verificationToken,
      tokenExpiry,
      ipAddress,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 5) Fire the verification email ---------------------------------------
    const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
    try {
      await sendVerificationEmail(email, username, verifyUrl);
    } catch (mailErr: any) {
      // Roll back so the user can retry registration cleanly.
      console.error("[v0] register: verification email failed:", mailErr?.message);
      await adminAuth.deleteUser(uid).catch(() => {});
      await usersRef.doc(uid).delete().catch(() => {});
      return NextResponse.json(
        { error: "We couldn't send the verification email. Please try again shortly." },
        { status: 502 }
      );
    }

    console.log(`[v0] register: created user ${uid} (${email}), verification email dispatched.`);

    return NextResponse.json(
      { success: true, message: "Account created. Check your email to verify your account." },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[v0] register: unexpected error:", err?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
