"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trophy } from "lucide-react";
import Image from "next/image";

interface Offerwall {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  avgPoints: number;
  isActive: boolean;
  url: string;
  color: string;
}

const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    description: "Play games and complete tasks to earn high rewards",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    avgPoints: 1200,
    isActive: true,
    url: "#",
    color: "#9333ea",
  },
  {
    id: "pubscale",
    name: "PubScale",
    description: "Discover new apps and complete quick offers",
    logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp",
    avgPoints: 850,
    isActive: true,
    url: "#",
    color: "#2563eb",
  },
  {
    id: "gemiad",
    name: "GemiAd",
    description: "Access the highest paying tasks and complete instant surveys for rapid rewards",
    logoUrl: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png",
    avgPoints: 1500,
    isActive: true,
    url: "#",
    color: "#ff5722",
  },
  {
    id: "revtoo",
    name: "Revtoo",
    description: "Maximize your earnings with high-reward premium offers and instant, verified surveys",
    logoUrl: "https://revtoo.com/assets/offerwall/images/revtoo-dark.svg",
    avgPoints: 1800,
    isActive: true,
    url: "#",
    color: "#0ea5e9",
  },
  {
    id: "offery",
    name: "Offery",
    description: "Maximize your earnings with high-reward premium offers and instant, verified surveys",
    logoUrl: "https://earng.net/storage/providers/x5v40jKJIoMPSNXMmiyTkK0eWIGXHPXSsAT2QRYb.png",
    avgPoints: 1600,
    isActive: true,
    url: "#",
    color: "#ffc107",
  },
  {
    id: "adtogame",
    name: "AdToGame",
    description: "Unlock exclusive high-payout opportunities and earn points instantly through top-tier surveys",
    logoUrl: "https://earng.net/storage/providers/GtCTDFNK8p1W2yfdiBtF9khJjbw6zN9FztVJQdii.svg",
    avgPoints: 2200,
    isActive: true,
    url: "#",
    color: "#25D3C2",
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "offerwalls"), orderBy("avgPoints", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const walls = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Offerwall[];
        setOfferwalls(walls.filter((w) => w.isActive));
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const getDynamicUrl = (wall: Offerwall) => {
    if (!userData?.uid) return "#";
    const uid = userData.uid;
    if (wall.id === "playtime") return `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`;
    if (wall.id === "pubscale") return `https://wow.pubscale.com?app_id=99429038&user_id=${uid}`;
    if (wall.id === "gemiad") return `https://gemiwall.com/69c1622e82a1cd59c17a2e21/${uid}`;
    if (wall.id === "revtoo") return `https://revtoo.com/offerwall/xol9xws01wsarkpuv7miwdair6ikvu/${uid}`;
    if (wall.id === "offery") return `https://offery.io/offerwall/uccnjpr7cd6llvbomgr04no1hofoob/${uid}`;
    if (wall.id === "adtogame") return `https://adtowall.com/7683/${uid}`;
    return wall.url;
  };

  // تحسين منطق الليفل: كل 10 آلاف نقطة ليفل جديد
  const pointsPerLevel = 10000;
  const userTotalPoints = userData?.totalEarned || 0;
  const currentLevel = Math.floor(userTotalPoints / pointsPerLevel) + 1;
  const pointsInCurrentLevel = userTotalPoints % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  const sortedOfferwalls = [...offerwalls].sort((a, b) => b.avgPoints - a.avgPoints);

  return (
    <div className="space-y-6">
      {/* شريط آخر الأرباح (Recent Earnings Feed) */}
      <div className="relative flex overflow-x-hidden border-y border-white/[0.05] bg-white/[0.02] py-2 backdrop-blur-sm">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2 px-4">
              <div className="h-2 w-2 rounded-full bg-[#00D2FF] animate-pulse" />
              <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest">
                User <span className="text-[#A65FFF]">#{(1000 + i)}</span> just earned 
                <span className="mx-1 text-white font-black">{(i * 250).toLocaleString()}</span> 
                PTS from <span className="text-[#E366FF]">Lootably</span>
              </span>
            </div>
          ))}
        </div>

        {/* تكرار الشريط لضمان استمرارية الحركة */}
        <div className="absolute top-2 flex animate-marquee2 whitespace-nowrap gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2 px-4">
              <div className="h-2 w-2 rounded-full bg-[#00D2FF] animate-pulse" />
              <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest">
                User <span className="text-[#A65FFF]">#{(1000 + i)}</span> just earned 
                <span className="mx-1 text-white font-black">{(i * 250).toLocaleString()}</span> 
                PTS from <span className="text-[#E366FF]">Lootably</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* 1. Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Image src="/coin.png" alt="Coin" width={28} height={28} className="animate-pulse object-contain" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Points Balance</p>
              <p className="text-2xl font-black text-white">
                {(userData?.points ?? 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#A65FFF]/10 border border-[#A65FFF]/20">
              <Trophy className="h-6 w-6 text-[#A65FFF]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Current Level</p>
              <p className="text-2xl font-black text-[#A65FFF]">
                Level {currentLevel}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Level Progress */}
      <Card className="border-border bg-[#0D0D0D] border-white/5">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#A65FFF]" />
              <span className="font-black text-sm text-white uppercase tracking-wider">
                Level {currentLevel} Progress
              </span>
            </div>
            <span className="text-xs font-bold text-white/40 tracking-tighter">
              {pointsInCurrentLevel.toLocaleString()} / {pointsPerLevel.toLocaleString()} PTS
            </span>
          </div>
          
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] transition-all duration-500 shadow-[0_0_10px_rgba(166,95,255,0.3)]" 
              style={{ width: `${levelProgress}%` }}
            ></div>
          </div>
          
          <p className="mt-3 text-[11px] text-white/30 font-medium">
            Earn {(pointsPerLevel - pointsInCurrentLevel).toLocaleString()} more points to reach Level {currentLevel + 1}
          </p>
        </CardContent>
      </Card>

      {/* 3. Offerwalls Grid */}
      <div>
        <h2 className="mb-4 text-xl font-black text-white tracking-tight">Earn Points</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border bg-card animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-muted mb-4" />
                  <div className="h-5 w-32 bg-muted rounded mb-2" />
                  <div className="h-4 w-full bg-muted rounded mb-4" />
                </CardContent>
              </Card>
            ))
          ) : (
            sortedOfferwalls.map((wall) => (
              <Card key={wall.id} className="border-border bg-card transition-all hover:border-[#A65FFF]/30 hover:shadow-lg hover:shadow-[#A65FFF]/5">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <img 
                        src={wall.logoUrl} 
                        alt={wall.name} 
                        className="h-12 w-12 rounded-xl object-contain bg-white/5 p-1"
                    />
                    <Badge variant="secondary" className="bg-[#A65FFF]/10 text-[#A65FFF] border border-[#A65FFF]/20 flex items-center gap-1 font-bold">
                      <Image src="/coin.png" width={10} height={10} alt="coin" />
                      ~{(wall.avgPoints ?? 0).toLocaleString()} pts
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3 font-black text-white">{wall.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">{wall.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button
                    className="w-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] text-white font-black text-xs hover:opacity-90 transition-all active:scale-95 border-none shadow-lg shadow-purple-500/10"
                    onClick={() => window.open(getDynamicUrl(wall), "_blank")}
                  >
                    START EARNING
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
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
