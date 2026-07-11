"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Loader2 } from "lucide-react";

interface OfferRecord {
  id: string;
  offerName?: string;
  points?: number;
  company?: string;
  createdAt?: any;
}

function formatDate(value: any) {
  try {
    const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
    return date ? date.toLocaleString() : "N/A";
  } catch {
    return "N/A";
  }
}

export function ProfileOffersHistory({ userId }: { userId?: string }) {
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const offersQuery = query(
      collection(db, "offers_history"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      offersQuery,
      (snap) => {
        setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OfferRecord));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [userId]);

  return (
    <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-lg">
          <Gift className="h-5 w-5 text-primary" /> Offers History
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Offers you completed and the rewards you earned
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No completed offers yet</p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="space-y-3 sm:hidden">
              {offers.map((o) => (
                <li
                  key={o.id}
                  className="rounded-xl border border-border bg-secondary/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground break-words">{o.offerName || "Offer"}</p>
                    <span className="shrink-0 font-bold text-emerald-500">
                      +{(o.points || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{o.company || "—"}</span>
                    <span>{formatDate(o.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop / tablet: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="py-3 pr-4 font-bold">Offer</th>
                    <th className="py-3 pr-4 font-bold text-right">Points</th>
                    <th className="py-3 pr-4 font-bold">Company</th>
                    <th className="py-3 font-bold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {offers.map((o) => (
                    <tr key={o.id} className="hover:bg-secondary/20">
                      <td className="py-3 pr-4 font-medium text-foreground max-w-[160px] truncate">
                        {o.offerName || "Offer"}
                      </td>
                      <td className="py-3 pr-4 text-right font-bold text-emerald-500">
                        +{(o.points || 0).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground capitalize">{o.company || "—"}</td>
                      <td className="py-3 text-right text-muted-foreground whitespace-nowrap">
                        {formatDate(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
