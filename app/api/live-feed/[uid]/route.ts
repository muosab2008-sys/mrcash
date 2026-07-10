import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseOfferName, calculateLevel, toMillis } from "@/lib/live-feed-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface UserActivity {
  id: string;
  offerName: string;
  company: string;
  reward: number;
  createdAtMs: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string | null;
  level: number;
  joinedAtMs: number;
  offersCompleted: number;
  totalEarnings: number;
  usersReferred: number;
  activities: UserActivity[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const { uid } = await params;

    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = userSnap.data() as any;

    // Pull this user's credited activity from the transactions collection.
    // Sort in memory (equality + orderBy on another field would need a
    // composite index, so we avoid requiring one).
    const txSnap = await adminDb
      .collection("transactions")
      .where("userId", "==", uid)
      .limit(200)
      .get();

    const credited = txSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((t) => t.type !== "chargeback" && Number(t.points ?? t.amount ?? 0) > 0)
      .sort((a, b) => toMillis(b.timestamp ?? b.createdAt) - toMillis(a.timestamp ?? a.createdAt));

    const activities: UserActivity[] = credited.slice(0, 50).map((t) => {
      const { offerName, company } = parseOfferName(t.offerName);
      return {
        id: t.id,
        offerName,
        company: t.offerwallName || t.offerwall || company || "Offerwall",
        reward: Number(t.points ?? t.amount ?? 0),
        createdAtMs: toMillis(t.timestamp ?? t.createdAt),
      };
    });

    // Count how many users this member referred.
    let usersReferred = 0;
    try {
      const refCount = await adminDb
        .collection("users")
        .where("referredBy", "==", uid)
        .count()
        .get();
      usersReferred = refCount.data().count;
    } catch {
      usersReferred = 0;
    }

    const profile: UserProfile = {
      uid,
      username: user.username || "Anonymous",
      photoURL: user.photoURL || null,
      level: calculateLevel(user.totalEarned || 0),
      joinedAtMs: toMillis(user.createdAt),
      offersCompleted: credited.length,
      totalEarnings: Number(user.totalEarned || 0),
      usersReferred,
      activities,
    };

    return NextResponse.json(profile, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    console.error("[live-feed/uid] error:", error?.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
