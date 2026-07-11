import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseOfferName, calculateLevel, toMillis } from "@/lib/live-feed-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface FeedItem {
  id: string;
  userId: string;
  username: string;
  photoURL: string | null;
  level: number;
  offerName: string;
  company: string;
  reward: number;
  createdAtMs: number;
}

export async function GET() {
  try {
    // Pull the most recent credited transactions written by the postback routes.
    const snap = await adminDb
      .collection("transactions")
      .orderBy("timestamp", "desc")
      .limit(60)
      .get();

    const rows = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
      .filter((t) => {
        const reward = Number(t.points ?? t.amount ?? 0);
        return t.type !== "chargeback" && reward > 0;
      })
      .slice(0, 30);

    // Batch-load the user profiles referenced by the feed.
    const userIds = Array.from(
      new Set(rows.map((r) => r.userId).filter(Boolean)),
    );

    const userMap = new Map<string, any>();
    if (userIds.length > 0) {
      const userRefs = userIds.map((id) =>
        adminDb.collection("users").doc(id),
      );
      const userDocs = await adminDb.getAll(...userRefs);
      userDocs.forEach((d) => {
        if (d.exists) userMap.set(d.id, d.data());
      });
    }

    const items: FeedItem[] = rows.map((t) => {
      const user = userMap.get(t.userId) || {};
      const { offerName, company } = parseOfferName(t.offerName);
      return {
        id: t.id,
        userId: t.userId || "",
        username: user.username || "Anonymous",
        photoURL: user.photoURL || null,
        level: calculateLevel(user.totalEarned || 0),
        offerName,
        company: t.offerwallName || t.offerwall || company || "Offerwall",
        reward: Number(t.points ?? t.amount ?? 0),
        createdAtMs: toMillis(t.timestamp ?? t.createdAt),
      };
    });

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: any) {
    console.error("[live-feed] error:", error?.message);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
