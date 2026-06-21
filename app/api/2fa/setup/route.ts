import { NextRequest, NextResponse } from "next/server";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and userId are required" },
        { status: 400 }
      );
    }

    // Generate a new Base32 TOTP secret (Google Authenticator compatible)
    const secret = generateSecret();

    // Build the otpauth:// URI for the QR code.
    // We intentionally rely on the standard defaults (SHA1 / 6 digits / 30s)
    // because those are what authenticator apps assume by default. Passing a
    // mismatched algorithm casing here was part of what broke the old flow.
    const otpauthUrl = generateURI({
      strategy: "totp",
      issuer: "MrCash",
      label: email,
      secret,
      digits: 6,
      period: 30,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      secret,
      qrCodeDataUrl,
      manualKey: secret,
    });
  } catch (error) {
    console.error("[v0] 2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to generate 2FA secret" },
      { status: 500 }
    );
  }
}
