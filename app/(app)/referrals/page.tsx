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
import { Users, Copy, Share2, Gift, UserPlus, CheckCircle, DollarSign } from "lucide-react";

// Helper to convert points to USD
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-white/50">
          Invite friends and earn 10% of everything they earn!
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-[#3B82F6]/20">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50">Total Referrals</p>
              <p className="text-3xl font-black text-white">
                {referrals.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50">Commission Earned</p>
              <p className="text-3xl font-black text-emerald-500">
                ${pointsToUSD(totalCommissionEarned)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] shadow-lg shadow-[#8B5CF6]/20">
              <Gift className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50">Commission Rate</p>
              <p className="text-3xl font-black text-[#8B5CF6]">10%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="border-[#3B82F6]/20 bg-[#0a0a0a] rounded-2xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Share2 className="h-5 w-5 text-[#3B82F6]" />
            Your Referral Link
          </CardTitle>
          <CardDescription className="text-white/40">
            Share this link with friends to earn commission on their earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="flex-1 font-mono text-sm h-12 rounded-2xl bg-white/[0.02] border-white/5 text-white"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(referralLink, "Referral link")}
              className="rounded-2xl h-12 border-white/5 hover:bg-white/5"
            >
              <Copy className="h-4 w-4 text-white" />
            </Button>
            <Button
              onClick={shareLink}
              className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white h-12 rounded-2xl px-6"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-white/5" />
            <span className="text-sm text-white/40">or use code</span>
            <div className="flex-1 border-t border-white/5" />
          </div>

          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="flex-1 font-mono text-center text-lg font-bold tracking-wider h-12 rounded-2xl bg-white/[0.02] border-white/5 text-white"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(referralCode, "Referral code")}
              className="rounded-2xl h-12 border-white/5 hover:bg-white/5"
            >
              <Copy className="h-4 w-4 text-white" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <UserPlus className="h-5 w-5 text-[#3B82F6]" />
              Your Referrals
            </CardTitle>
            <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 rounded-xl px-3 py-1">{referrals.length} users</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-white/5 p-4 animate-pulse"
                >
                  <div className="h-5 w-32 bg-white/10 rounded-lg" />
                  <div className="h-5 w-20 bg-white/10 rounded-lg" />
                </div>
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-white/30" />
              <p className="text-lg font-medium text-white">No referrals yet</p>
              <p className="text-sm text-white/50">
                Share your referral link to start earning commission!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.uid}
                  className="flex items-center justify-between rounded-2xl bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3B82F6]/10">
                      <CheckCircle className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{referral.username}</p>
                      <p className="text-xs text-white/40">
                        Joined {referral.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/40">Earned</p>
                    <p className="font-black text-lg text-[#3B82F6]">
                      ${pointsToUSD(referral.totalEarned)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Gift className="h-5 w-5 text-[#8B5CF6]" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ul className="space-y-3 text-sm text-white/60">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-xs font-bold text-[#3B82F6]">1</span>
              Share your unique referral link or code with friends.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-xs font-bold text-[#3B82F6]">2</span>
              When they sign up using your link, they become your referral.
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-xs font-bold text-[#3B82F6]">3</span>
              You earn 10% commission on every dollar they earn - instantly!
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-xs font-bold text-[#3B82F6]">4</span>
              {"There's no limit - the more friends you invite, the more you earn!"}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
