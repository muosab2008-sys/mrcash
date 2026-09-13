"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Ticket, Gift, Loader2, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

// Points to USD conversion
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

export default function PromoPage() {
  const { userData } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentCodes, setRecentCodes] = useState<
    { code: string; success: boolean; reward: string }[]
  >([]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !code.trim()) return;
    setLoading(true);
    const normalizedCode = code.trim().toUpperCase();

    try {
      const response = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to redeem code");

      const reward = Number(result.reward_mc ?? 0);
      const rewardText = `${reward.toLocaleString()} MC ($${pointsToUSD(reward)})`;
      toast.success(`Code redeemed! You received ${rewardText}`);
      setRecentCodes((current) => [{ code: normalizedCode, success: true, reward: rewardText }, ...current.slice(0, 4)]);
      setCode("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to redeem code";
      toast.error(message);
      setRecentCodes((current) => [{ code: normalizedCode, success: false, reward: message }, ...current.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
        <p className="text-muted-foreground">
          Enter promo codes to receive bonus MC!
        </p>
      </div>

      {/* Current Balance */}
      <Card className="glass-card">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary border border-border">
            <Image src="/coin.png" alt="Points" width={32} height={32} className="w-8 h-8 object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-foreground">
                {(userData?.points || 0).toLocaleString()}
              </p>
              <span className="text-sm text-muted-foreground">MC</span>
            </div>
            <p className="text-xs text-primary">= ${pointsToUSD(userData?.points || 0)} USD</p>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Code */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg">
            <Ticket className="h-5 w-5 text-primary" />
            Redeem Promo Code
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your promo code below to claim your rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={handleRedeem} className="flex gap-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code..."
              className="flex-1 font-mono text-center text-lg uppercase tracking-widest h-14 rounded-xl bg-secondary/30 border-border"
              maxLength={20}
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              className="brand-gradient text-white px-8 h-14 rounded-xl font-bold"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Redeem"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Redemptions */}
      {recentCodes.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-foreground text-lg">Recent Attempts</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2">
              {recentCodes.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-xl p-4 ${
                    item.success ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-destructive/10 border border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.success ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-mono font-bold text-foreground">{item.code}</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      item.success ? "text-emerald-500" : "text-destructive"
                    }`}
                  >
                    {item.reward}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="glass-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Where to Find Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
              Follow our social media for exclusive promo codes.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
              Check your email for special promotional offers.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">3</span>
              Participate in community events to win codes.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">4</span>
              Each code can only be used once per account.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
