"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Gift, Clock, Trophy, Users, Zap, Crown, Loader2 } from "lucide-react";

interface Giveaway {
  id: string;
  title: string;
  prize: string;
  prizeAmount: number;
  tier: "daily" | "weekly" | "monthly";
  totalFragments: number;
  endsAt: Date;
  winnerId: string | null;
  isActive: boolean;
}

interface Contributor {
  id: string;
  username: string;
  fragments: number;
}

interface GiveawayWithContributors extends Giveaway {
  contributors: Contributor[];
  userContribution: number;
}

const tierConfig = {
  daily: { label: "24 Hour", color: "text-emerald-500", bgColor: "bg-emerald-500/10", icon: Clock },
  weekly: { label: "Weekly", color: "text-[var(--brand-cyan)]", bgColor: "bg-[var(--brand-cyan)]/10", icon: Trophy },
  monthly: { label: "Monthly", color: "text-[var(--brand-purple)]", bgColor: "bg-[var(--brand-purple)]/10", icon: Crown },
};

// Default giveaways for demo
const defaultGiveaways: GiveawayWithContributors[] = [
  {
    id: "daily-1",
    title: "Daily Jackpot",
    prize: "$5 PayPal",
    prizeAmount: 5,
    tier: "daily",
    totalFragments: 0,
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    winnerId: null,
    isActive: true,
    contributors: [],
    userContribution: 0,
  },
  {
    id: "weekly-1",
    title: "Weekly Grand Prize",
    prize: "$25 PayPal",
    prizeAmount: 25,
    tier: "weekly",
    totalFragments: 0,
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    winnerId: null,
    isActive: true,
    contributors: [],
    userContribution: 0,
  },
  {
    id: "monthly-1",
    title: "Monthly Mega Prize",
    prize: "$100 PayPal",
    prizeAmount: 100,
    tier: "monthly",
    totalFragments: 0,
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    winnerId: null,
    isActive: true,
    contributors: [],
    userContribution: 0,
  },
];

function formatTimeRemaining(endsAt: Date): string {
  const now = new Date();
  const diff = endsAt.getTime() - now.getTime();
  
  if (diff <= 0) return "Ended";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function GiveawaysPage() {
  const { userData } = useAuth();
  const [giveaways, setGiveaways] = useState<GiveawayWithContributors[]>(defaultGiveaways);
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});
  const [depositing, setDepositing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to giveaways collection
    const giveawaysQuery = query(collection(db, "giveaways"), orderBy("endsAt", "asc"));
    
    const unsubscribe = onSnapshot(
      giveawaysQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          setLoading(false);
          return;
        }

        const giveawaysData: GiveawayWithContributors[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const giveaway: GiveawayWithContributors = {
            id: docSnap.id,
            title: data.title,
            prize: data.prize,
            prizeAmount: data.prizeAmount,
            tier: data.tier,
            totalFragments: data.totalFragments || 0,
            endsAt: data.endsAt?.toDate() || new Date(),
            winnerId: data.winnerId || null,
            isActive: data.isActive,
            contributors: [],
            userContribution: 0,
          };

          giveawaysData.push(giveaway);
        }

        setGiveaways(giveawaysData.length > 0 ? giveawaysData : defaultGiveaways);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData?.uid]);

  const handleDeposit = async (giveawayId: string) => {
    if (!userData) return;

    const amount = parseInt(depositAmounts[giveawayId] || "0");
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > userData.fragments) {
      toast.error("Not enough fragments");
      return;
    }

    setDepositing(giveawayId);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userData.uid);
        const giveawayRef = doc(db, "giveaways", giveawayId);
        const contributionRef = doc(db, "giveaways", giveawayId, "contributions", userData.uid);

        const userDoc = await transaction.get(userRef);
        const giveawayDoc = await transaction.get(giveawayRef);
        const contributionDoc = await transaction.get(contributionRef);

        if (!userDoc.exists()) throw new Error("User not found");
        
        const currentFragments = userDoc.data().fragments || 0;
        if (currentFragments < amount) throw new Error("Not enough fragments");

        const currentGiveawayFragments = giveawayDoc.exists() ? (giveawayDoc.data().totalFragments || 0) : 0;
        const currentContribution = contributionDoc.exists() ? (contributionDoc.data().fragments || 0) : 0;

        // Update user fragments
        transaction.update(userRef, {
          fragments: currentFragments - amount,
        });

        // Update giveaway total
        if (giveawayDoc.exists()) {
          transaction.update(giveawayRef, {
            totalFragments: currentGiveawayFragments + amount,
          });
        }

        // Update or create contribution
        transaction.set(contributionRef, {
          userId: userData.uid,
          username: userData.username,
          fragments: currentContribution + amount,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      toast.success(`Deposited ${amount} fragments!`);
      setDepositAmounts({ ...depositAmounts, [giveawayId]: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to deposit");
    } finally {
      setDepositing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Free Giveaways</h1>
        <p className="text-muted-foreground">
          Deposit fragments to compete for prizes. The top contributor wins!
        </p>
      </div>

      {/* User Fragments */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-purple)]">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Fragments</p>
              <p className="text-xl font-bold text-[var(--brand-purple)]">
                {userData?.fragments.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-[var(--brand-purple)] text-[var(--brand-purple)]">
            Ready to deposit
          </Badge>
        </CardContent>
      </Card>

      {/* Giveaways Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 w-24 bg-muted rounded mb-4" />
                <div className="h-8 w-full bg-muted rounded mb-4" />
                <div className="h-20 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          giveaways.filter(g => g.isActive).map((giveaway) => {
            const config = tierConfig[giveaway.tier];
            const Icon = config.icon;
            const userContribution = giveaway.userContribution;
            const isTopContributor = giveaway.contributors[0]?.id === userData?.uid;

            return (
              <Card key={giveaway.id} className="border-border bg-card overflow-hidden">
                <div className={`h-1 ${giveaway.tier === "daily" ? "bg-emerald-500" : giveaway.tier === "weekly" ? "bg-[var(--brand-cyan)]" : "bg-[var(--brand-purple)]"}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={`${config.bgColor} ${config.color} border-0`}>
                      <Icon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTimeRemaining(giveaway.endsAt)}
                    </div>
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className={config.color} />
                    {giveaway.title}
                  </CardTitle>
                  <CardDescription className="text-lg font-semibold text-foreground">
                    Prize: {giveaway.prize}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pool Stats */}
                  <div className="rounded-lg bg-secondary p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Pool</span>
                      <span className="font-bold text-[var(--brand-purple)]">
                        {giveaway.totalFragments.toLocaleString()} fragments
                      </span>
                    </div>
                    {userContribution > 0 && (
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your Contribution</span>
                        <span className="font-bold text-[var(--brand-cyan)]">
                          {userContribution.toLocaleString()} fragments
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Top Contributors */}
                  {giveaway.contributors.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">
                        Top Contributors
                      </p>
                      <div className="space-y-2">
                        {giveaway.contributors.slice(0, 3).map((contributor, index) => (
                          <div
                            key={contributor.id}
                            className={`flex items-center justify-between rounded-lg p-2 ${
                              index === 0 ? "bg-amber-500/10" : "bg-secondary"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {index === 0 && <Crown className="h-4 w-4 text-amber-500" />}
                              <span className="text-sm font-medium">
                                {contributor.username}
                                {contributor.id === userData?.uid && " (You)"}
                              </span>
                            </div>
                            <span className="text-sm font-bold">
                              {contributor.fragments.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deposit Form */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Fragments"
                      value={depositAmounts[giveaway.id] || ""}
                      onChange={(e) =>
                        setDepositAmounts({ ...depositAmounts, [giveaway.id]: e.target.value })
                      }
                      className="flex-1"
                      min={1}
                      max={userData?.fragments || 0}
                    />
                    <Button
                      onClick={() => handleDeposit(giveaway.id)}
                      disabled={depositing === giveaway.id || !userData?.fragments}
                      className="brand-gradient text-primary-foreground"
                    >
                      {depositing === giveaway.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Deposit"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Rules */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">1.</span>
              Earn fragments by completing offers on the Earn page.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">2.</span>
              Deposit your fragments into any giveaway pool.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">3.</span>
              The user with the MOST fragments deposited when the timer ends wins!
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">4.</span>
              Prizes are automatically credited to the winner{"'"}s account.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
