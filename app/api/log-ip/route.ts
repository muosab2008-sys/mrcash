import { NextRequest, NextResponse } from "next/server";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/postback-utils";

/**
 * Logs the authenticated user's IP address on registration and login.
 *
 * The client sends a Firebase ID token in the Authorization header; the server
 * verifies it, derives the real client IP from the platform headers, and records
 * it both on the user document and in an immutable `ip_logs` collection used by
 * the admin anti-fraud tooling.
 *
 * Body: { event: "register" | "login" }
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; the first is the client.
    return forwarded.split(",")[0].trim();
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const adminDb = getAdminDb();
    const decoded = await getAuth(getApps()[0]).verifyIdToken(token);
    const uid = decoded.uid;

    const body = await request.json().catch(() => ({}));
    const event: "register" | "login" =
      body?.event === "register" ? "register" : "login";

    const ip = getClientIp(request);
    const country = request.headers.get("x-vercel-ip-country") || "";
    const city = request.headers.get("x-vercel-ip-city") || "";
    const userAgent = request.headers.get("user-agent") || "";

    // Record an immutable log entry.
    await adminDb.collection("ip_logs").add({
      userId: uid,
      ip,
      country,
      city: city ? decodeURIComponent(city) : "",
      event,
      userAgent,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update the user document with the latest / registration IP.
    const userRef = adminDb.collection("users").doc(uid);
    const updates: Record<string, unknown> = {
      lastLoginIp: ip,
      lastLoginCountry: country,
      lastLoginAt: FieldValue.serverTimestamp(),
    };
    if (event === "register") {
      updates.registrationIp = ip;
      updates.registrationCountry = country;
    } else {
      // Only set registrationIp if it has never been recorded (covers older accounts).
      const snap = await userRef.get();
      if (snap.exists && !snap.data()?.registrationIp) {
        updates.registrationIp = ip;
        updates.registrationCountry = country;
      }
    }

    await userRef.set(updates, { merge: true });

    return NextResponse.json({ success: true, ip, country });
  } catch (error) {
    console.error("log-ip error:", error);
    return NextResponse.json({ error: "Failed to log IP" }, { status: 500 });
  }
}
