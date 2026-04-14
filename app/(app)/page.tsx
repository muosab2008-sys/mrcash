"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trophy, X, ArrowLeft, Maximize2, Send, ShieldCheck, Globe, DollarSign, ThumbsUp, ThumbsDown, Flame } from "lucide-react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";

// Helper function to convert points to USD
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

// --- Live Feed ---
function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(15));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);
  if (feedItems.length === 0) return null;
  return (
    <div className="w-full flex justify-center py-2 select-none relative z-40">
      <div className="relative flex items-center h-12 w-full bg-[#0a0a0a]/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl overflow-visible">
        <div className="absolute left-0 z-[60] bg-[#0a0a0a]/90 backdrop-blur-xl px-5 h-full flex items-center border-r border-white/5 rounded-l-2xl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">Live</span>
          </div>
        </div>
        <div className="flex-1 h-full overflow-hidden rounded-2xl ml-24 relative z-10">
          <div className="flex whitespace-nowrap items-center h-full animate-scroll group hover:[animation-play-state:paused]">
            {[...feedItems, ...feedItems].map((item, index) => (
              <div key={`${item.id}-${index}`} className="relative inline-flex items-center gap-3 px-6 border-r border-white/5 h-full">
                <Avatar className="h-7 w-7 border border-white/10 rounded-lg">
                  <AvatarImage src={item.photoURL} />
                  <AvatarFallback className="bg-white/5 text-[10px] rounded-lg">{item.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white/90">{item.username}</span>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 px-2 py-0.5 rounded-lg border border-[#3B82F6]/20">
                    <span className="font-black text-[#3B82F6]">${pointsToUSD(item.points || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{` @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-scroll { animation: scroll 40s linear infinite; } `}</style>
    </div>
  );
}

interface Offerwall { 
  id: string; 
  name: string; 
  description: string; 
  logoUrl: string; 
  avgPoints: number; 
  isActive: boolean; 
  url: string; 
  color: string;
  likes?: number;
  dislikes?: number;
  isHot?: boolean;
}

const defaultOfferwalls: Offerwall[] = [
  { id: "playtime", name: "PlayTimeSdk", description: "Play games and complete tasks to earn high rewards", logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp", avgPoints: 1200, isActive: true, url: "#", color: "#9333ea", likes: 25, dislikes: 10, isHot: true },
  { id: "pubscale", name: "PubScale", description: "Discover new apps and complete quick offers", logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp", avgPoints: 850, isActive: true, url: "#", color: "#2563eb", likes: 18, dislikes: 5, isHot: false },
  { id: "gemiad", name: "GemiAd", description: "Access the highest paying tasks and complete instant surveys", logoUrl: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png", avgPoints: 1500, isActive: true, url: "#", color: "#ff5722", likes: 32, dislikes: 8, isHot: true },
  { id: "revtoo", name: "Revtoo", description: "Maximize your earnings with high-reward premium offers", logoUrl: "https://revtoo.com/assets/offerwall/images/revtoo-dark.svg", avgPoints: 1800, isActive: true, url: "#", color: "#0ea5e9", likes: 45, dislikes: 12, isHot: true },
  { id: "offery", name: "Offery", description: "Maximize your earnings with instant, verified surveys", logoUrl: "https://earng.net/storage/providers/x5v40jKJIoMPSNXMmiyTkK0eWIGXHPXSsAT2QRYb.png", avgPoints: 1600, isActive: true, url: "#", color: "#ffc107", likes: 28, dislikes: 6, isHot: false },
  { id: "adtogame", name: "AdToGame", description: "Unlock exclusive high-payout opportunities", logoUrl: "https://earng.net/storage/providers/GtCTDFNK8p1W2yfdiBtF9khJjbw6zN9FztVJQdii.svg", avgPoints: 2200, isActive: true, url: "#", color: "#25D3C2", likes: 52, dislikes: 15, isHot: true },
  { id: "pixylabs", name: "PixyLabs", description: "Complete high-paying offers and tasks from PixyLabs", logoUrl: "https://earng.net/storage/providers/79LyQwnqcRHoZsaEdiDmzoFQK5S2VOOIRUtwQ3LU.png", avgPoints: 2000, isActive: true, url: "#", color: "#6366f1", likes: 38, dislikes: 9, isHot: false },
  { id: "adlexy", name: "Adlexy", description: "Complete premium offers and earn instant rewards with Adlexy", logoUrl: "https://bagiracash.com/assets/images/networks/690680a83ff6d.webp", avgPoints: 1900, isActive: true, url: "#", color: "#3b82f6", likes: 22, dislikes: 7, isHot: false },
  { id: "taskwall", name: "TaskWall", description: "Complete premium tasks and high-paying offers with TaskWall", logoUrl: "http://publishers.taskwall.io//manager/uploads/logo-2.png", avgPoints: 2100, isActive: true, url: "#", color: "#10b981", likes: 41, dislikes: 11, isHot: true },
  { id: "wannads", name: "Wannads", description: "Complete high-paying surveys and exclusive offers with Wannads", logoUrl: "https://affi-plat.s3.us-east-2.amazonaws.com/platforms/wannads-ogotipo-naranja.png", avgPoints: 2500, isActive: true, url: "#", color: "#ff4757", likes: 55, dislikes: 14, isHot: true },
  { id: "bagirawall", name: "BagiraWall", description: "Unlock exclusive high-payout offers and premium tasks with BagiraWall", logoUrl: "https://bagiracash.com/assets/images/networks/698b5555a836d.png", avgPoints: 2300, isActive: true, url: "#", color: "#f59e0b", likes: 35, dislikes: 8, isHot: false },
  { id: "flexwall", name: "Flex Wall", description: "Complete high-paying offers and premium tasks with Flex Wall", logoUrl: "https://media.licdn.com/dms/image/v2/D4D0BAQGjjGNPMg4b5A/company-logo_200_200/B4DZdj2GDwHAAM-/0/1749726817858/flex_wall_logo?e=2147483647&v=beta&t=FX9Rns8aGV87i0C6XdTSsPag5BpWgXrfFnK38vzM4ts", avgPoints: 2200, isActive: true, url: "#", color: "#6366f1", likes: 29, dislikes: 6, isHot: false },
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState<{url: string, title: string} | null>(null);

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
      adtogame: `https://adtowall.com/7683/${uid}`,
      pixylabs: `https://offerwall.pixylabs.co/230?uid=${uid}`,
      adlexy: `https://adlexy.com/offerwall/7czsknu4bdnqutvkilmntorwwr0s2s/${uid}`,
      taskwall: `https://wall.taskwall.io/?app_id=e723adebdbab293255deefe5fe401b43&userid=${uid}`,
      wannads: `https://earn.wannads.com/wall?apiKey=69c2b3a37bb68663049007&userId=${uid}`,
      bagirawall: `https://bagirawall.com/offerwall/20/${uid}`,
      flexwall: `https://flexwall.net/iframe?app_id=412&user_id=${uid}`,
    };
    return urls[wall.id] || wall.url;
  };

  const pointsPerLevel = 10000;
  const currentLevel = Math.floor((userData?.totalEarned || 0) / pointsPerLevel) + 1;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  // Calculate like percentage for progress bar
  const getLikePercentage = (likes: number = 0, dislikes: number = 0) => {
    const total = likes + dislikes;
    if (total === 0) return 50;
    return (likes / total) * 100;
  };

  if (activeOffer) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#080808] flex flex-col">
        <div className="flex items-center justify-between p-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-white rounded-xl hover:bg-white/5"><ArrowLeft className="h-5 w-5" /></Button>
            <span className="font-bold text-white text-sm">{activeOffer.title}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => window.open(activeOffer.url, '_blank')} className="text-white/50 rounded-xl hover:bg-white/5"><Maximize2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-white/50 rounded-xl hover:bg-white/5"><X className="h-5 w-5" /></Button>
          </div>
        </div>
        <iframe src={activeOffer.url} className="w-full flex-1 border-0" title={activeOffer.title} allow="autoplay; fullscreen" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full p-4 sm:p-6"> 
      <LiveFeed />

      {/* Balance and Level Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Balance Card - USD Display */}
        <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-[#3B82F6]/20">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white/50 font-medium">Available Balance</p>
              <p className="text-3xl font-black text-white">${pointsToUSD(userData?.points ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Level Card */}
        <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] shadow-lg shadow-[#8B5CF6]/20">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white/50 font-medium">Current Level</p>
              <p className="text-3xl font-black text-white">Level {currentLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-2xl">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 text-white font-bold text-sm">
              <Trophy className="h-5 w-5 text-[#8B5CF6] shrink-0" />
              <span>Level {currentLevel} Progress</span>
            </div>
            <span className="text-xs font-medium text-white/40">${pointsToUSD(pointsInCurrentLevel)} / ${pointsToUSD(pointsPerLevel)}</span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-xl overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-500 rounded-xl" style={{ width: `${levelProgress}%` }}></div>
          </div>
        </CardContent>
      </Card>

      {/* Offerwalls Section */}
      <div>
        <h2 className="mb-4 text-xl font-black text-white tracking-tight">Earn Money</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? ( 
            <p className="col-span-full text-sm text-white/50 text-center py-8">Loading...</p> 
          ) : (
            offerwalls.map((wall) => (
              <div 
                key={wall.id} 
                onClick={() => { const url = getDynamicUrl(wall); if (url !== "#") setActiveOffer({ url, title: wall.name }); }}
                className="relative bg-[#0d0d0d]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-5 cursor-pointer transition-all hover:border-[#8B5CF6]/30 hover:shadow-lg hover:shadow-[#8B5CF6]/5 group"
              >
                {/* Hot Badge */}
                {wall.isHot && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 font-bold text-[10px] px-2 py-1 rounded-lg flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      Hot
                    </Badge>
                  </div>
                )}

                {/* Logo and Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/5 p-2 shrink-0 border border-white/5">
                    <img src={wall.logoUrl} alt={wall.name} className="h-full w-full object-contain" />
                  </div>
                  <span className="font-bold text-white text-lg">{wall.name}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-500" 
                      style={{ width: `${getLikePercentage(wall.likes, wall.dislikes)}%` }}
                    ></div>
                    <div 
                      className="h-full bg-white/10" 
                      style={{ width: `${100 - getLikePercentage(wall.likes, wall.dislikes)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Like/Dislike Stats */}
                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span className="font-medium">{wall.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ThumbsDown className="h-3.5 w-3.5 text-white/30" />
                    <span className="font-medium">{wall.dislikes || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl pt-12 pb-10 w-full px-4 sm:px-8 rounded-2xl">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-xl" loading="eager" priority />
              <span className="text-2xl font-black bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent italic tracking-tighter">
                MrCash
              </span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-medium">The premier destination for turning tasks into real digital rewards securely and instantly.</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest">Trust</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-white/50"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Encryption</div>
              <div className="flex items-center gap-2 text-xs text-white/50"><Globe className="w-4 h-4 text-[#3B82F6]" /> Global Payouts</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest">Legal</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/privacy-policy" className="text-xs text-white/50 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-xs text-white/50 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest">Community</h4>
            <a href="https://t.me/+HaIWYiOHx-FkNzY0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-[#080808]/50 border border-white/5 hover:border-[#3B82F6]/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] flex items-center justify-center border border-white/5 group-hover:bg-[#0088cc] transition-colors">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase">Telegram</span>
                <span className="text-[10px] text-white/40 font-medium">Official Channel</span>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-white/30 tracking-widest">2026 MR.CASH - ALL RIGHTS RESERVED</p>
        </div>
      </footer>
    </div>
  );
}
