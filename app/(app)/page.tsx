"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Coins, Trophy, Zap, Star } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  avgPoints: number;
  pointsPerFragment: number;
  isActive: boolean;
  url: string;
  color: string;
}

// Default offerwalls for demo (in production these would be from Firestore)
const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    description: "Play games and complete tasks to earn high rewards",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    avgPoints: 1200,
    pointsPerFragment: 15,
    isActive: true,
    // رابط بلاي تايم مع الـ App ID الخاص بك
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    color: "#9333ea", // بنفسجي (توهج فخم)
  },
  {
    id: "pubscale",
    name: "PubScale",
    description: "Discover new apps and complete quick offers",
    logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp",
    avgPoints: 850,
    pointsPerFragment: 12,
    isActive: true,
    // رابط بوب سكيل مع المعرف 99429038
    url: (uid: string) => `https://sdk.pubscale.com/wall/v1/?appId=99429038&subId=${uid}`,
    color: "#2563eb", // أزرق (توهج احترافي)
  },
  {
    id: "3",
    name: "Lootably",
    description: "Premium offers with high payouts",
    logoUrl: "/offerwalls/lootably.png",
    avgPoints: 1000,
    pointsPerFragment: 20,
    isActive: true,
    url: "#",
    color: "#9C27B0",
  },
  {
    id: "4",
    name: "CPX Research",
    description: "Market research surveys for cash",
    logoUrl: "/offerwalls/cpx.png",
    avgPoints: 600,
    pointsPerFragment: 12,
    isActive: true,
    url: "#",
    color: "#FF9800",
  },
  {
    id: "5",
    name: "Bitlabs",
    description: "Quick surveys with instant credit",
    logoUrl: "/offerwalls/bitlabs.png",
    avgPoints: 450,
    pointsPerFragment: 9,
    isActive: true,
    url: "#",
    color: "#E91E63",
  },
  {
    id: "6",
    name: "Revenue Universe",
    description: "Diverse offers from top brands",
    logoUrl: "/offerwalls/revenue.png",
    avgPoints: 800,
    pointsPerFragment: 16,
    isActive: true,
    url: "#",
    color: "#00BCD4",
  },
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch offerwalls from Firestore, fallback to defaults
    const q = query(collection(db, "offerwalls"), orderBy("avgPoints", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const walls = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Offerwall[];
          setOfferwalls(walls.filter((w) => w.isActive));
        }
        setLoading(false);
      },
      () => {
        // On error, use defaults
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Calculate level progress
  const currentLevelThreshold = (userData?.level || 1) * 10000;
  const previousLevelThreshold = ((userData?.level || 1) - 1) * 10000;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

  // Sort offerwalls by avgPoints (highest first)
  const sortedOfferwalls = [...offerwalls].sort((a, b) => b.avgPoints - a.avgPoints);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient">
              <Coins className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points Balance</p>
              <p className="text-2xl font-bold text-[var(--brand-cyan)]">
                {(userData?.points ?? 0).toLocaleString()}
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
                {(userData?.fragments ?? 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Level</p>
              <p className="text-2xl font-bold text-amber-500">
                Level {userData?.level || 1}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <Star className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold text-emerald-500">
                {(userData?.totalEarned ?? 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Level {userData?.level || 1}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {(pointsInCurrentLevel ?? 0).toLocaleString()} / {(pointsNeededForLevel ?? 0).toLocaleString()}
            </span>
          </div>
          <Progress value={levelProgress} className="h-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            Earn {Math.max(0, pointsNeededForLevel - pointsInCurrentLevel).toLocaleString()} more points to reach Level {(userData?.level || 1) + 1} and get a $1.00 bonus!
          </p>
        </CardContent>
      </Card>

      {/* Offerwalls */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Earn Points</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border bg-card animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-muted mb-4" />
                  <div className="h-5 w-32 bg-muted rounded mb-2" />
                  <div className="h-4 w-full bg-muted rounded mb-4" />
                  <div className="h-10 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            sortedOfferwalls.map((wall) => (
              <Card key={wall.id} className="border-border bg-card transition-all hover:border-[var(--brand-cyan)]/50 hover:shadow-lg hover:shadow-[var(--brand-cyan)]/10">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
                      style={{ backgroundColor: wall.color }}
                    >
                      {wall.name.charAt(0)}
                    </div>
                    <Badge variant="secondary" className="bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)]">
                      ~{(wall.avgPoints ?? 0).toLocaleString()} pts
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{wall.name}</CardTitle>
                  <CardDescription>{wall.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-[var(--brand-purple)]" />
                    <span>+{wall.pointsPerFragment} fragments per task</span>
                  </div>
                  <Button
                    className="w-full brand-gradient text-primary-foreground"
                    onClick={() => window.open(wall.url, "_blank")}
                  >
                    Start Earning
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
