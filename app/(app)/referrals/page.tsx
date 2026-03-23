"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Copy, Share2, Gift, Coins, UserPlus, CheckCircle } from "lucide-react";

interface Referral {
  uid: string;
  username: string;
  totalEarned: number;
  createdAt: Date;
}

export default function ReferralsPage() {
  const { userData } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${userData?.uid || ""}`
    : "";

  const referralCode = userData?.uid || "";

  useEffect(() => {
    if (!userData?.uid) return;

    // Listen to users referred by this user
    const q = query(
      collection(db, "users"),
      where("referredBy", "==", userData.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const refs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            username: data.username,
            totalEarned: data.totalEarned || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        }) as Referral[];
        setReferrals(refs);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData?.uid]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join MrCash",
          text: "Earn rewards with MrCash! Use my referral link to get started:",
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyToClipboard(referralLink, "Referral link");
    }
  };

  // Calculate total commission earned (10% default)
  const commissionRate = 0.1; // 10%
  const totalReferralEarnings = referrals.reduce((acc, ref) => acc + ref.totalEarned, 0);
  const totalCommissionEarned = Math.floor(totalReferralEarnings * commissionRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">
          Invite friends and earn 10% of everything they earn!
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold text-[var(--brand-cyan)]">
                {referrals.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <Coins className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Earned</p>
              <p className="text-2xl font-bold text-emerald-500">
                {totalCommissionEarned.toLocaleString()} pts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-purple)]">
              <Gift className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="text-2xl font-bold text-[var(--brand-purple)]">10%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="border-[var(--brand-cyan)]/30 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[var(--brand-cyan)]" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends to earn commission on their earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(referralLink, "Referral link")}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={shareLink}
              className="brand-gradient text-primary-foreground"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-sm text-muted-foreground">or use code</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="flex-1 font-mono text-center text-lg font-bold tracking-wider"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(referralCode, "Referral code")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Your Referrals
            </CardTitle>
            <Badge variant="secondary">{referrals.length} users</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4 animate-pulse"
                >
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-5 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No referrals yet</p>
              <p className="text-sm text-muted-foreground">
                Share your referral link to start earning commission!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.uid}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-cyan)]/10">
                      <CheckCircle className="h-5 w-5 text-[var(--brand-cyan)]" />
                    </div>
                    <div>
                      <p className="font-medium">{referral.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {referral.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Earned</p>
                    <p className="font-bold text-[var(--brand-cyan)]">
                      {referral.totalEarned.toLocaleString()} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[var(--brand-purple)]" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">1.</span>
              Share your unique referral link or code with friends.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">2.</span>
              When they sign up using your link, they become your referral.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">3.</span>
              You earn 10% commission on every point they earn - instantly!
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">4.</span>
              There{"'"}s no limit - the more friends you invite, the more you earn!
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
