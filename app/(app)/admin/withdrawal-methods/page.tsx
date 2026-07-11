"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Wallet, CheckCircle, Ban, Loader2 } from "lucide-react";
import Link from "next/link";

// The full catalog of withdrawal methods offered on the cashout page.
// Keep the `id` values in sync with the cashout page so toggles map correctly.
const ALL_METHODS: { id: string; name: string; category: string; icon: string }[] = [
  { id: "paypal", name: "PayPal", category: "Cashout Methods", icon: "https://earng.net/storage/images/oipeSzxn0qPxwAFms2XGG7K8cGO5TznxhlQ8TmcL.png" },
  { id: "visa", name: "Visa Tremendous", category: "Cashout Methods", icon: "https://earng.net/storage/images/b7e5Ish9TrqPixjxgUXjGIZfAizgbxivJTLm9Nhq.png" },
  { id: "faucetpay", name: "FaucetPay", category: "Crypto & Wallets", icon: "https://earng.net/storage/temp-images/niLsNzBAPnZvq2XFAijzOc5fEXOFN0Fh1QKaE5Wv.png" },
  { id: "binance", name: "Binance", category: "Crypto & Wallets", icon: "https://earng.net/storage/images/ZweowA5mo9MrohnCYKI3VkCfJGZwbVLBbH24QUXU.png" },
  { id: "litecoin", name: "Litecoin", category: "Crypto & Wallets", icon: "https://earng.net/storage/images/c2YcgB4WR4QIpNjZWXULqMcthmyUQHKMg9o1Wnl6.png" },
  { id: "cwallet", name: "cWallet", category: "Crypto & Wallets", icon: "https://earng.net/storage/images/CVMa2olhLqSdi0DhCsurT7qVZNzubx0Bv6yjaWE7.png" },
  { id: "amazon", name: "Amazon", category: "Gift Cards", icon: "https://earng.net/storage/images/HjLzhYmDg1Kul5979jLDii0BCfiQdE8Z2fzaLFWT.png" },
  { id: "google", name: "Google Play US", category: "Gift Cards", icon: "https://earng.net/storage/images/cR9c5tKppt6nWks7U1WS2Hp2S10zX6gPHMEuYPII.png" },
  { id: "itunes", name: "iTunes Apple", category: "Gift Cards", icon: "https://earng.net/storage/images/fEtLXen6YAH82wW1uS5osza3t1APXcKINWrCOixH.png" },
  { id: "pubg", name: "PUBG Mobile", category: "Skins & Gaming", icon: "https://earng.net/storage/temp-images/33d2d2cjBBy67mkJkMPfREmBUtBkBy9drOEFBYPu.png" },
  { id: "freefire", name: "Free Fire", category: "Skins & Gaming", icon: "https://earng.net/storage/images/OfIJyyst0nKyLpnm1yR12w3DUuNbhTJBIy9A3nXG.png" },
];

export default function WithdrawalMethodsPage() {
  // Map of methodId -> enabled. Missing entries default to enabled (true).
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "withdrawal_methods"), (snapshot) => {
      const map: Record<string, boolean> = {};
      snapshot.docs.forEach((d) => {
        map[d.id] = d.data().enabled !== false;
      });
      setStatuses(map);
    });
    return () => unsub();
  }, []);

  const isEnabled = (id: string) => statuses[id] !== false;

  const toggleMethod = async (method: { id: string; name: string }, enabled: boolean) => {
    setSaving(method.id);
    // Optimistic update
    setStatuses((prev) => ({ ...prev, [method.id]: enabled }));
    try {
      await setDoc(
        doc(db, "withdrawal_methods", method.id),
        { name: method.name, enabled, updatedAt: new Date() },
        { merge: true }
      );
      toast.success(`${method.name} is now ${enabled ? "available" : "unavailable"}`);
    } catch (error: any) {
      // Roll back on failure
      setStatuses((prev) => ({ ...prev, [method.id]: !enabled }));
      toast.error(error.message || "Failed to update method");
    } finally {
      setSaving(null);
    }
  };

  const categories = Array.from(new Set(ALL_METHODS.map((m) => m.category)));
  const enabledCount = ALL_METHODS.filter((m) => isEnabled(m.id)).length;
  const disabledCount = ALL_METHODS.length - enabledCount;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Wallet className="h-6 w-6 text-[#3B82F6]" />
            Withdrawal Methods
          </h1>
          <p className="text-white/50">Enable or disable payout methods shown on the cashout page</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-white/50">Available</p>
              <p className="text-3xl font-black text-emerald-500">{enabledCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
              <Ban className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-white/50">Unavailable</p>
              <p className="text-3xl font-black text-red-500">{disabledCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methods by category */}
      {categories.map((category) => (
        <Card key={category} className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">{category}</CardTitle>
            <CardDescription className="text-white/40">
              Toggle a method off to hide it from users on the cashout page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ALL_METHODS.filter((m) => m.category === category).map((method) => {
              const enabled = isEnabled(method.id);
              return (
                <div
                  key={method.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={method.icon || "/placeholder.svg"} alt={method.name} className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{method.name}</p>
                      {enabled ? (
                        <Badge className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                          Available
                        </Badge>
                      ) : (
                        <Badge className="mt-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {saving === method.id && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => toggleMethod(method, checked)}
                      disabled={saving === method.id}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
