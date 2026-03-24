"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trophy, Star, Zap, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

// --- مكون الـ Live Feed الكامل مع المؤثرات ---
function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(15));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  if (feedItems.length === 0) return null;

  return (
    <div className="w-full flex justify-center py-2 bg-transparent select-none relative z-40">
      <div className="relative flex items-center h-12 w-full bg-[#0d0d0d]/80 backdrop-blur-md rounded-full border border-white/5 shadow-2xl overflow-visible">
        <div className="absolute left-0 z-[60] bg-[#0d0d0d] px-5 h-full flex items-center border-r border-white/5 rounded-l-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Live
            </span>
          </div>
        </div>

        <div className="flex-1 h-full overflow-hidden rounded-full ml-24 relative z-10">
          <div className="flex whitespace-nowrap items-center h-full animate-scroll group hover:[animation-play-state:paused]">
            {[...feedItems, ...feedItems].map((item, index) => {
              const itemId = `${item.id}-${index}`;
              return (
                <div
                  key={itemId}
                  className="relative inline-flex items-center gap-3 px-6 border-r border-white/5 cursor-pointer h-full transition-colors hover:bg-white/[0.02]"
                  onMouseEnter={() => setActiveTooltip(itemId)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <Avatar className="h-7 w-7 border border-white/10 ring-2 ring-cyan-500/20">
                    <AvatarImage src={item.photoURL} />
                    <AvatarFallback className="bg-white/5 text-[10px]">{item.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white/90">{item.username}</span>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      <span className="font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        +{(item.points || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Tooltip المتقدم */}
                  <div className={`absolute bottom-[125%] left-1/2 -translate-x-1/2 w-52 bg-[#0a0a0a] border border-white/10 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 z-[999] pointer-events-none ${activeTooltip === itemId ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible translate-y-2 scale-95"}`}>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter truncate">{item.offerName || "Task Completed"}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{item.source}</span>
                        <span className="text-[8px] text-green-400 font-bold">VERIFIED</span>
                      </div>
                    </div>
                    <div className="absolute top-[98%] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-b border-r border-white/10 rotate-45"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-24 z-20 bg-gradient-to-l from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent pointer-events-none rounded-r-full" />
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll { animation: scroll 45s linear infinite; }
      `}</style>
    </div>
  );
}

interface Offerwall {
  id: string; name: string; description: string; logoUrl: string;
  avgPoints: number; isActive: boolean; url: string; color: string;
}

const defaultOfferwalls: Offerwall[] = [
  { id: "playtime", name: "PlayTimeAds", description: "Play games and complete tasks to earn high rewards", logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp", avgPoints: 1200, isActive: true, url: "#", color: "#9333ea" },
  { id: "pubscale", name: "PubScale", description: "Discover new apps and complete quick offers", logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp", avgPoints: 850, isActive: true, url: "#", color: "#2563eb" },
  { id: "gemiad", name: "GemiAd", description: "Access the highest paying tasks and complete instant surveys", logoUrl: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png", avgPoints: 1500, isActive: true, url: "#", color: "#ff5722" },
  { id: "revtoo", name: "Revtoo", description: "Maximize your earnings with high-reward premium offers", logoUrl: "https://revtoo.com/assets/offerwall/images/revtoo-dark.svg", avgPoints: 1800, isActive: true, url: "#", color: "#0ea5e9" },
  { id: "offery", name: "Offery", description: "Maximize your earnings with instant, verified surveys", logoUrl: "https://earng.net/storage/providers/x5v40jKJIoMPSNXMmiyTkK0eWIGXHPXSsAT2QRYb.png", avgPoints: 1600, isActive: true, url: "#", color: "#ffc107" },
  { id: "adtogame", name: "AdToGame", description: "Unlock exclusive high-payout opportunities", logoUrl: "https://earng.net/storage/providers/GtCTDFNK8p1W2yfdiBtF9khJjbw6zN9FztVJQdii.svg", avgPoints: 2200, isActive: true, url: "#", color: "#25D3C2" }
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
    const urls: Record<string, string> = {
      playtime: `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
      pubscale: `https://wow.pubscale.com?app_id=99429038&user_id=${uid}`,
      gemiad: `https://gemiwall.com/69c1622e82a1cd59c17a2e21/${uid}`,
      revtoo: `https://revtoo.com/offerwall/xol9xws01wsarkpuv7miwdair6ikvu/${uid}`,
      offery: `https://offery.io/offerwall/uccnjpr7cd6llvbomgr04no1hofoob/${uid}`,
      adtogame: `https://adtowall.com/7683/${uid}`
    };
    return urls[wall.id] || wall.url;
  };

  const pointsPerLevel = 10000;
  const currentLevel = Math.floor((userData?.totalEarned || 0) / pointsPerLevel) + 1;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  return (
    <div className="flex flex-col gap-4 pt-1 pb-12 px-4 min-h-screen overflow-y-auto bg-[#050505]">
      
      {/* 1. Live Feed - وضعت في الأعلى مع مسافة علوية بسيطة جداً */}
      <LiveFeed />

      {/* 2. Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 mt-1">
        <Card className="border-white/5 bg-[#0A0A0A] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <CardContent className="flex items-center gap-5 p-5 relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-transform group-hover:scale-110 duration-300">
              <Image src="/coin.png" alt="Coin" width={32} height={32} className="animate-pulse object-contain" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Available Points</p>
              <p className="text-3xl font-black text-white tracking-tighter">{(userData?.points ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0A0A0A] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#A65FFF]/[0.02] to-transparent pointer-events-none" />
          <CardContent className="flex items-center gap-5 p-5 relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A65FFF]/10 border border-[#A65FFF]/20 transition-transform group-hover:scale-110 duration-300">
              <Trophy className="h-7 w-7 text-[#A65FFF]" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Current Mastery</p>
              <div className="flex items-center gap-2">
                 <p className="text-3xl font-black text-[#A65FFF] tracking-tighter">Level {currentLevel}</p>
                 <Badge className="bg-[#A65FFF]/20 text-[#A65FFF] border-none text-[8px] font-black h-5">PRO</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Level Progress Card */}
      <Card className="border-white/5 bg-[#0A0A0A] overflow-hidden">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Target className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <span className="font-black text-xs text-white uppercase tracking-widest block">Season Progress</span>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Next Level: {currentLevel + 1}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-white/90 block">
                {pointsInCurrentLevel.toLocaleString()} <span className="text-white/30">/ {pointsPerLevel.toLocaleString()}</span>
              </span>
            </div>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(166,95,255,0.4)]" 
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Offerwalls Grid */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-6 px-1">
           <div className="flex items-center gap-2">
             <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">Premium Walls</h2>
           </div>
           <Badge variant="outline" className="border-white/10 text-white/40 font-bold text-[9px] px-3 py-1">6 PARTNERS ACTIVE</Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
             <div className="col-span-full flex flex-col items-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#A65FFF]/20 border-t-[#A65FFF] rounded-full animate-spin" />
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">Syncing Offerwalls...</p>
             </div>
          ) : (
            offerwalls.map((wall) => (
              <Card key={wall.id} className="border-white/5 bg-[#0A0A0A] transition-all hover:border-[#A65FFF]/40 group hover:-translate-y-1 duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#A65FFF]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img src={wall.logoUrl} alt={wall.name} className="h-14 w-14 rounded-2xl object-contain bg-white/5 p-2 relative z-10 border border-white/5" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-[#A65FFF]/10 text-[#A65FFF] border border-[#A65FFF]/20 flex items-center gap-1.5 font-black text-[10px] py-1 px-3">
                        <Star className="h-3 w-3 fill-[#A65FFF]" />
                        UP TO {wall.avgPoints.toLocaleString()}
                      </Badge>
                      <span className="text-[8px] text-white/20 font-bold uppercase mr-1">Points / Task</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-4 font-black text-white group-hover:text-[#A65FFF] transition-colors">{wall.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-[11px] leading-relaxed text-white/40 mt-1 font-medium italic">
                    {wall.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <Button 
                    className="w-full h-11 bg-white/5 hover:bg-[#A65FFF] text-white font-black text-xs hover:shadow-[0_10px_20px_rgba(166,95,255,0.2)] transition-all active:scale-95 border border-white/10 hover:border-transparent group"
                    onClick={() => window.open(getDynamicUrl(wall), "_blank")}
                  >
                    ENTER OFFERWALL 
                    <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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
