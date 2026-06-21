"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gift, Loader2, Check, Lock, Sparkles, ShieldCheck, Globe, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const BONUS_POINTS = 1000; // 1,000 MC = $1.00

export default function BonusPage() {
  const { user, userData } = useAuth();
  const [claiming, setClaiming] = useState(false);

  const eligible = userData?.bonusEligible ?? false;
  const claimed = userData?.bonusClaimed ?? false;

  const claimBonus = async () => {
    if (!user?.uid || !userData) return;
    if (claimed) {
      toast.error("You have already claimed your $1 bonus.");
      return;
    }
    if (!eligible) {
      toast.error("You are not eligible to claim the bonus yet.");
      return;
    }

    setClaiming(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: increment(BONUS_POINTS),
        totalEarned: increment(BONUS_POINTS),
        bonusClaimed: true,
        bonusClaimedAt: serverTimestamp(),
      });
      toast.success("$1.00 bonus claimed! +1,000 MC added to your balance.");
    } catch (error) {
      console.error("[v0] claim bonus error:", error);
      toast.error("Failed to claim bonus. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  // Visual + label state for the claim card.
  const state: "claimed" | "ready" | "locked" = claimed ? "claimed" : eligible ? "ready" : "locked";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 sm:p-6">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-balance text-2xl font-bold sm:text-3xl">$1 Bonus Reward</h1>
          <p className="text-pretty text-sm text-muted-foreground sm:text-base">
            Claim a flat $1.00 bonus the moment your account qualifies. One reward per account.
          </p>
        </header>

        {/* Hero claim card */}
        <Card className="glass-card overflow-hidden border-primary/20">
          <div
            className={`flex flex-col items-center gap-5 p-6 text-center sm:p-10 ${
              state === "ready" ? "points-glow" : ""
            }`}
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg sm:h-24 sm:w-24 ${
                state === "claimed"
                  ? "bg-emerald-500"
                  : state === "ready"
                    ? "brand-gradient glow-primary"
                    : "bg-secondary border border-border"
              }`}
            >
              {state === "claimed" ? (
                <Check className="h-10 w-10 text-white sm:h-12 sm:w-12" />
              ) : state === "ready" ? (
                <Gift className="h-10 w-10 text-white sm:h-12 sm:w-12" />
              ) : (
                <Lock className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-5xl font-black tracking-tight sm:text-6xl">
                <span className="brand-gradient-text">$1.00</span>
              </p>
              <p className="text-sm text-muted-foreground">= 1,000 MC credited instantly</p>
            </div>

            {state === "claimed" && (
              <p className="text-sm font-medium text-emerald-500">
                Bonus already claimed. Thanks for being part of MrCash!
              </p>
            )}
            {state === "ready" && (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" /> You qualify! Claim your reward now.
              </p>
            )}
            {state === "locked" && (
              <p className="text-sm text-muted-foreground">
                Keep completing offers. Your bonus unlocks automatically once you meet the criteria.
              </p>
            )}

            <Button
              onClick={claimBonus}
              disabled={state !== "ready" || claiming}
              className="h-12 w-full max-w-xs rounded-xl text-base font-bold brand-gradient text-white disabled:opacity-60 sm:h-14"
            >
              {claiming ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : state === "claimed" ? (
                <Check className="mr-2 h-5 w-5" />
              ) : (
                <Gift className="mr-2 h-5 w-5" />
              )}
              {state === "claimed" ? "Bonus Claimed" : state === "ready" ? "Claim $1.00 Now" : "Locked"}
            </Button>
          </div>
        </Card>

        {/* Eligibility status */}
        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Eligibility Status</p>
              <p className="text-xs text-muted-foreground">
                {claimed
                  ? "Reward redeemed"
                  : eligible
                    ? "Eligible — ready to claim"
                    : "Not yet eligible"}
              </p>
            </div>
            <span
              className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                claimed
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  : eligible
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {claimed ? "Claimed" : eligible ? "Ready" : "Locked"}
            </span>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="glass-card">
          <CardContent className="space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Gift className="h-5 w-5 text-primary" /> How it works
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                Stay active by completing offers and tasks on MrCash.
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  2
                </span>
                Once your account meets the bonus criteria, the claim button unlocks automatically.
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  3
                </span>
                Tap claim to instantly add 1,000 MC ($1.00) to your balance. One bonus per account.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 w-full border-t border-border bg-card/50 px-4 pb-10 pt-12 backdrop-blur-xl sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="MrCash logo" width={32} height={32} className="rounded-xl" />
              <span className="text-2xl font-black tracking-tight brand-gradient-text">MrCash</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              The premier destination for turning tasks into real digital rewards securely and instantly.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trust</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Secure Encryption
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-4 w-4 text-primary" /> Global Payouts
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Legal</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/privacy-policy" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Terms of Service
              </Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Community</h4>
            <a
              href="https://t.me/+HaIWYiOHx-FkNzY0"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors group-hover:brand-gradient">
                <Send className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-foreground">Telegram</span>
                <span className="text-[10px] font-medium text-muted-foreground">Official Channel</span>
              </div>
            </a>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">2026 MR.CASH - ALL RIGHTS RESERVED</p>
        </div>
      </footer>
    </div>
  );
}
