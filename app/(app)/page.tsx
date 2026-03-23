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

// تم تحديث الشركات هنا وحذف القديم وإضافة PlayTime و PubScale
const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    description: "Play games and complete tasks to earn high rewards",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    avgPoints: 1200,
    pointsPerFragment: 15,
    isActive: true,
    url: "#", // سيتم استبداله برابط المستخدم تلقائياً
    color: "#9333ea",
  },
  {
    id: "pubscale",
    name: "PubScale",
    description: "Discover new apps and complete quick offers",
    logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp",
    avgPoints: 850,
    pointsPerFragment: 12,
    isActive: true,
    url: "#", // سيتم استبداله برابط المستخدم تلقائياً
    color: "#2563eb",
  },
  {
   id: "gemiad",
    name: "GemiAd",
    description: "Access the highest paying tasks and complete instant surveys for rapid rewards",
    // شعار GemiAd الرسمي (من الأصول الخاصة بهم)
    logoUrl: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png", 
    avgPoints: 1500,
    pointsPerFragment: 18,
    isActive: true,
    url: "#",
    color: "#ff5722", // برتقالي مميز
  },
  {
    id: "revtoo",
    name: "Revtoo",
    description: "Maximize your earnings with high-reward premium offers and instant, verified surveys",
    // شعار Revtoo (يمكنك استخدام شعارهم الرسمي)
    logoUrl: "https://revtoo.com/assets/offerwall/images/revtoo-dark.svg", 
    avgPoints: 1800,
    pointsPerFragment: 20,
    isActive: true,
    url: "#",
    color: "#0ea5e9", // لون سماوي (Sky Blue) احترافي جداً
  },
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // تحديث روابط الشركات برقم ID المستخدم الحالي
  const getDynamicUrl = (wall: Offerwall) => {
    if (!userData?.uid) return "#";
    
    if (wall.id === "playtime") {
      return `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${userData.uid}`;
    }
    if (wall.id === "pubscale") {
      return `https://wow.pubscale.com?app_id=99429038&user_id=${userData.uid}`;
    }
   if (wall.id === "gemiad") {
    // الرابط المعتمد من التوثيق باستخدام الـ Placement ID الخاص بك
    return `https://gemiwall.com/69c1622e82a1cd59c17a2e21/${userData.uid}`;
    }
   if (wall.id === "revtoo") {
    // استبدل 'YOUR_REVTOO_API_KEY' بالـ Key الخاص بك من لوحة تحكم Revtoo
    const API_KEY = "xol9xws01wsarkpuv7miwdair6ikvu"; 
    return `https://revtoo.com/offerwall/${API_KEY}/${userData.uid}`;
  }
  }
  };

  const currentLevelThreshold = (userData?.level || 1) * 10000;
  const previousLevelThreshold = ((userData?.level || 1) - 1) * 10000;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

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
            Array.from({ length: 3 }).map((_, i) => (
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
                    {/* عرض الشعار كصورة إذا كانت موجودة، وإلا عرض أول حرف */}
                    {wall.logoUrl.startsWith("http") || wall.logoUrl.startsWith("/") ? (
                        <img 
                            src={wall.logoUrl} 
                            alt={wall.name} 
                            className="h-12 w-12 rounded-xl object-contain bg-white/5 p-1"
                        />
                    ) : (
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
                          style={{ backgroundColor: wall.color }}
                        >
                          {wall.name.charAt(0)}
                        </div>
                    )}
                    <Badge variant="secondary" className="bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)]">
                      ~{(wall.avgPoints ?? 0).toLocaleString()} pts
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{wall.name}</CardTitle>
                  <CardDescription>{wall.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-[var(--brand-purple)]" />
                    <span>+{wall.pointsPerFragment} fragments per task</span>
                  </div>
                  <Button
                    className="w-full brand-gradient text-primary-foreground font-bold"
                    onClick={() => window.open(getDynamicUrl(wall), "_blank")}
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
