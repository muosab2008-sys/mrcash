import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { sendCustomEmail, brandedEmail } from "@/lib/email";
import { isStrictAlnum, isValidEmail, isValidPassword, generateSecureToken, getClientIp, getBaseUrl } from "@/lib/validation";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, fullName, referralCode, photoURL } = await request.json();

    // ---------- Strict input validation ----------
    if (!email || !username || !password || !fullName) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!isStrictAlnum(username)) {
      return NextResponse.json(
        { error: "Username may only contain English letters and numbers." },
        { status: 400 }
      );
    }

    if (!isStrictAlnum(fullName)) {
      return NextResponse.json(
        { error: "Full name may only contain English letters and numbers." },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters (English letters, numbers, and symbols only)." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // ---------- Duplicate checks in Firestore ----------
    const [emailDup, usernameDup] = await Promise.all([
      adminDb.collection("users").where("email", "==", normalizedEmail).limit(1).get(),
      adminDb.collection("users").where("username", "==", username).limit(1).get(),
    ]);

    if (!emailDup.empty) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    if (!usernameDup.empty) {
      return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
    }

    // ---------- Create the Firebase Auth user ----------
    let authUser;
    try {
      authUser = await adminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: username,
        emailVerified: false,
      });
    } catch (err: any) {
      if (err?.code === "auth/email-already-exists") {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      console.error("[v0] register: createUser failed:", err?.message || err);
      return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
    }

    const uid = authUser.uid;
    const verificationToken = generateSecureToken();
    const tokenExpiry = Date.now() + TOKEN_TTL_MS;
    const ipAddress = getClientIp(request.headers);

    // ---------- Resolve optional referral ----------
    let referredBy: string | null = null;
    if (referralCode) {
      const referrerSnap = await adminDb.collection("users").doc(String(referralCode)).get();
      if (referrerSnap.exists) referredBy = String(referralCode);
    }

    // ---------- Save the user profile ----------
    await adminDb.collection("users").doc(uid).set({
      uid,
      email: normalizedEmail,
      username,
      fullName,
      photoURL: typeof photoURL === "string" && photoURL ? photoURL : null,
      points: 0,
      fragments: 0,
      level: 1,
      totalEarned: 0,
      referredBy,
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

    // ---------- Fire the verification email ----------
    const verifyUrl = `${getBaseUrl(request.headers)}/verify-email?token=${verificationToken}`;
    try {
      await sendCustomEmail(
        normalizedEmail,
        "Verify your MrCash account",
        `Welcome to MrCash! Verify your email: ${verifyUrl}`,
        brandedEmail({
          heading: `Welcome, ${username}!`,
          body: "Thanks for joining MrCash. Please confirm your email address to activate your account and start earning rewards. This link expires in 24 hours.",
          buttonLabel: "Verify Email Address",
          buttonUrl: verifyUrl,
          footerNote: "If you didn't create a MrCash account, you can safely ignore this email.",
        })
      );
    } catch (err: any) {
      console.error("[v0] register: verification email failed:", err?.message || err);
      // Account exists but email failed — surface a recoverable message.
      return NextResponse.json(
        { success: true, warning: "Account created, but we couldn't send the verification email. Please use the resend option." },
        { status: 201 }
      );
    }

    console.log(`[v0] register: created user ${uid} (${normalizedEmail})`);
    return NextResponse.json(
      { success: true, message: "Account created. Check your email to verify your account." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[v0] register error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
