import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendCustomEmail, renderEmailTemplate } from "@/lib/email";
import {
  isStrictAlnum,
  isValidEmail,
  isValidPassword,
  generateSecureToken,
  getClientIp,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = "https://mrcash.app";
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
    const email = body.email?.trim().toLowerCase();
    const username = body.username?.trim();
    const fullName = body.fullName?.trim();
    const password = body.password;

    // ---- Strict input validation -------------------------------------------
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!isStrictAlnum(username) || username!.length < 3 || username!.length > 20) {
      return NextResponse.json(
        { error: "Username must be 3-20 English letters/numbers only." },
        { status: 400 },
      );
    }
    if (!isStrictAlnum(fullName) || fullName!.length < 2 || fullName!.length > 40) {
      return NextResponse.json(
        { error: "Full name must be 2-40 English letters/numbers only." },
        { status: 400 },
      );
    }
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 6 English letters/numbers/symbols." },
        { status: 400 },
      );
    }

    // ---- Duplicate checks ----------------------------------------------------
    const usersRef = adminDb.collection("users");

    const emailDup = await usersRef.where("email", "==", email).limit(1).get();
    if (!emailDup.empty) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const usernameDup = await usersRef.where("username", "==", username).limit(1).get();
    if (!usernameDup.empty) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }

    // ---- Create the Firebase Auth user --------------------------------------
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: username,
      emailVerified: false,
    });

    const verificationToken = generateSecureToken();
    const tokenExpiry = Date.now() + TOKEN_TTL_MS;
    const ipAddress = getClientIp(req.headers);

    await usersRef.doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      username,
      fullName,
      photoURL: null,
      points: 0,
      fragments: 0,
      level: 1,
      totalEarned: 0,
      referredBy: null,
      referralCode: userRecord.uid,
      isAdmin: false,
      isBanned: false,
      twoFactorEnabled: false,
      emailVerified: false,
      verificationToken,
      tokenExpiry,
      ipAddress,
      createdAt: FieldValue.serverTimestamp(),
    });

    // ---- Send verification email --------------------------------------------
    const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
    const html = renderEmailTemplate({
      heading: "Verify your email",
      intro: `Welcome to MrCash, ${username}! Confirm your email address to activate your account and start earning rewards. This link expires in 24 hours.`,
      buttonLabel: "Activate Account",
      buttonUrl: verifyUrl,
      footnote: "If you didn't create this account, you can safely ignore this email.",
    });
    const text = `Welcome to MrCash! Activate your account: ${verifyUrl} (expires in 24 hours)`;

    try {
      await sendCustomEmail(email, "Verify your MrCash account", text, html);
    } catch (mailErr) {
      console.error("[register] verification email failed:", mailErr);
      // Account exists but mail failed — surface a recoverable message.
      return NextResponse.json(
        {
          warning:
            "Account created, but we couldn't send the verification email. Please try resending later.",
          uid: userRecord.uid,
        },
        { status: 201 },
      );
    }

    console.log(`[register] created user ${userRecord.uid} (${email}) from ip ${ipAddress}`);
    return NextResponse.json(
      { success: true, uid: userRecord.uid, message: "Verification email sent." },
      { status: 201 },
    );
  } catch (err: any) {
    if (err?.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }
    console.error("[register] unexpected error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
