import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

/**
 * Best-effort extraction of the IP that completed the offer.
 * Prefers an explicit IP parameter sent by the offer company, then falls
 * back to the request headers (x-forwarded-for / x-real-ip).
 */
export function getPostbackIp(request: Request, ipParam?: string | null): string {
  if (ipParam && ipParam !== "undefined" && ipParam !== "null" && ipParam !== "1.1.1.1") {
    return ipParam.trim();
  }
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Records a completed offer into the `offers_history` collection so the admin
 * dashboard can audit every reward a user received, including the IP address
 * used to complete it (for VPN / multi-account detection).
 *
 * Only positive credits are logged — chargebacks / rejections are ignored here.
 */
export async function logOfferHistory(params: {
  userId: string;
  offerName: string;
  points: number;
  company: string;
  ipAddress?: string | null;
  transactionId?: string | null;
}): Promise<void> {
  try {
    if (!params.userId) return;
    if (!params.points || params.points <= 0) return;

    await adminDb.collection("offers_history").add({
      userId: params.userId,
      offerName: params.offerName || "Offer",
      points: Math.floor(params.points),
      company: params.company,
      ipAddress: params.ipAddress || "unknown",
      transactionId: params.transactionId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err: any) {
    console.error("[v0] logOfferHistory error:", err?.message || err);
  }
}
