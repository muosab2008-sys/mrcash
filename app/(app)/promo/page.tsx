"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Ticket, Gift, Coins, Zap, Loader2, CheckCircle, XCircle } from "lucide-react";

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

    try {
      const promoRef = doc(db, "promoCodes", code.toUpperCase());
      const promoSnap = await getDoc(promoRef);

      if (!promoSnap.exists()) {
        toast.error("Invalid promo code");
        setRecentCodes([
          { code: code.toUpperCase(), success: false, reward: "Invalid" },
          ...recentCodes.slice(0, 4),
        ]);
        setCode("");
        return;
      }

      const promoData = promoSnap.data();

      // Check if code is active
      if (!promoData.isActive) {
        toast.error("This promo code has expired");
        setRecentCodes([
          { code: code.toUpperCase(), success: false, reward: "Expired" },
          ...recentCodes.slice(0, 4),
        ]);
        setCode("");
        return;
      }

      // Check if user already used this code
      const usageRef = doc(db, "promoCodes", code.toUpperCase(), "usedBy", userData.uid);
      const usageSnap = await getDoc(usageRef);

      if (usageSnap.exists()) {
        toast.error("You have already used this code");
        setRecentCodes([
          { code: code.toUpperCase(), success: false, reward: "Already used" },
          ...recentCodes.slice(0, 4),
        ]);
        setCode("");
        return;
      }

      // Check uses limit
      if (promoData.maxUses && promoData.usesCount >= promoData.maxUses) {
        toast.error("This promo code has reached its usage limit");
        setRecentCodes([
          { code: code.toUpperCase(), success: false, reward: "Limit reached" },
          ...recentCodes.slice(0, 4),
        ]);
        setCode("");
        return;
      }

      // Redeem the code
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userData.uid);

        // Update user points/fragments
        const updates: Record<string, any> = {};
        if (promoData.pointsReward) {
          updates.points = (userData.points || 0) + promoData.pointsReward;
          updates.totalEarned = (userData.totalEarned || 0) + promoData.pointsReward;
        }
        if (promoData.fragmentsReward) {
          updates.fragments = (userData.fragments || 0) + promoData.fragmentsReward;
        }

        transaction.update(userRef, updates);

        // Mark code as used by this user
        transaction.set(usageRef, {
          userId: userData.uid,
          usedAt: serverTimestamp(),
        });

        // Increment uses count
        transaction.update(promoRef, {
          usesCount: (promoData.usesCount || 0) + 1,
        });
      });

      const rewardText = [];
      if (promoData.pointsReward) rewardText.push(`${promoData.pointsReward} points`);
      if (promoData.fragmentsReward) rewardText.push(`${promoData.fragmentsReward} fragments`);

      toast.success(`Code redeemed! You received ${rewardText.join(" + ")}`);
      setRecentCodes([
        { code: code.toUpperCase(), success: true, reward: rewardText.join(" + ") },
        ...recentCodes.slice(0, 4),
      ]);
      setCode("");
    } catch (error: any) {
      toast.error(error.message || "Failed to redeem code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <p className="text-muted-foreground">
          Enter promo codes to receive bonus points and fragments!
        </p>
      </div>

      {/* Current Balance */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient">
              <Coins className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points Balance</p>
              <p className="text-2xl font-bold text-[var(--brand-cyan)]">
                {userData?.points.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-purple)]">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fragments</p>
              <p className="text-2xl font-bold text-[var(--brand-purple)]">
                {userData?.fragments.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redeem Code */}
      <Card className="border-[var(--brand-cyan)]/30 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[var(--brand-cyan)]" />
            Redeem Promo Code
          </CardTitle>
          <CardDescription>
            Enter your promo code below to claim your rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRedeem} className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code..."
              className="flex-1 font-mono text-center text-lg uppercase tracking-widest"
              maxLength={20}
            />
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              className="brand-gradient text-primary-foreground px-8"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Redeem"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Redemptions */}
      {recentCodes.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Recent Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCodes.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    item.success ? "bg-emerald-500/10" : "bg-destructive/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.success ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-mono font-medium">{item.code}</span>
                  </div>
                  <span
                    className={`text-sm ${
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
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[var(--brand-purple)]" />
            Where to Find Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">1.</span>
              Follow our social media for exclusive promo codes.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">2.</span>
              Check your email for special promotional offers.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">3.</span>
              Participate in community events to win codes.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">4.</span>
              Each code can only be used once per account.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
