"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trophy, X, ArrowLeft, Maximize2, Send, ShieldCheck, Globe, DollarSign } from "lucide-react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

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
    <div className="w-full flex justify-center py-2 bg-transparent select-none relative z-40">
      <div className="relative flex items-center h-12 w-full bg-[#0d0d0d]/80 backdrop-blur-md rounded-full border border-white/5 shadow-2xl overflow-visible">
        <div className="absolute left-0 z-[60] bg-[#0d0d0d] px-5 h-full flex items-center border-r border-white/5 rounded-l-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Live</span>
          </div>
        </div>
        <div className="flex-1 h-full overflow-hidden rounded-full ml-24 relative z-10">
          <div className="flex whitespace-nowrap items-center h-full animate-scroll group hover:[animation-play-state:paused]">
            {[...feedItems, ...feedItems].map((item, index) => (
              <div key={`${item.id}-${index}`} className="relative inline-flex items-center gap-3 px-6 border-r border-white/5 h-full">
                <Avatar className="h-7 w-7 border border-white/10">
                  <AvatarImage src={item.photoURL} />
                  <AvatarFallback className="bg-white/5 text-[10px]">{item.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white/90">{item.username}</span>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    <span className="font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{(item.points || 0).toLocaleString()}</span>
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

interface Offerwall { id: string; name: string; description: string; logoUrl: string; avgPoints: number; isActive: boolean; url: string; color: string; }

const defaultOfferwalls: Offerwall[] = [
  { id: "playtime", name: "PlayTimeAds", description: "Play games and complete tasks to earn high rewards", logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp", avgPoints: 1200, isActive: true, url: "#", color: "#9333ea" },
  { id: "pubscale", name: "PubScale", description: "Discover new apps and complete quick offers", logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp", avgPoints: 850, isActive: true, url: "#", color: "#2563eb" },
  { id: "gemiad", name: "GemiAd", description: "Access the highest paying tasks and complete instant surveys", logoUrl: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png", avgPoints: 1500, isActive: true, url: "#", color: "#ff5722" },
  { id: "revtoo", name: "Revtoo", description: "Maximize your earnings with high-reward premium offers", logoUrl: "https://revtoo.com/assets/offerwall/images/revtoo-dark.svg", avgPoints: 1800, isActive: true, url: "#", color: "#0ea5e9" },
  { id: "offery", name: "Offery", description: "Maximize your earnings with instant, verified surveys", logoUrl: "https://earng.net/storage/providers/x5v40jKJIoMPSNXMmiyTkK0eWIGXHPXSsAT2QRYb.png", avgPoints: 1600, isActive: true, url: "#", color: "#ffc107" },
  { id: "adtogame", name: "AdToGame", description: "Unlock exclusive high-payout opportunities", logoUrl: "https://earng.net/storage/providers/GtCTDFNK8p1W2yfdiBtF9khJjbw6zN9FztVJQdii.svg", avgPoints: 2200, isActive: true, url: "#", color: "#25D3C2" },
  { id: "pixylabs", name: "PixyLabs", description: "Complete high-paying offers and tasks from PixyLabs", logoUrl: "https://earng.net/storage/providers/79LyQwnqcRHoZsaEdiDmzoFQK5S2VOOIRUtwQ3LU.png", avgPoints: 2000, isActive: true, url: "#", color: "#6366f1" },
  { id: "adlexy", name: "Adlexy", description: "Complete premium offers and earn instant rewards with Adlexy", logoUrl: "https://bagiracash.com/assets/images/networks/690680a83ff6d.webp", avgPoints: 1900, isActive: true, url: "#", color: "#3b82f6" },
  { id: "taskwall", name: "TaskWall", description: "Complete premium tasks and high-paying offers with TaskWall", logoUrl: "http://publishers.taskwall.io//manager/uploads/logo-2.png", avgPoints: 2100, isActive: true, url: "#", color: "#10b981" },
  { id: "wannads", name: "Wannads", description: "Complete high-paying surveys and exclusive offers with Wannads", logoUrl: "https://affi-plat.s3.us-east-2.amazonaws.com/platforms/wannads-ogotipo-naranja.png", avgPoints: 2500, isActive: true, url: "#", color: "#ff4757" },
  { id: "bagirawall", name: "BagiraWall", description: "Unlock exclusive high-payout offers and premium tasks with BagiraWall", logoUrl: "https://bagiracash.com/assets/images/networks/698b5555a836d.png", avgPoints: 2300, isActive: true, url: "#", color: "#f59e0b" },
  { id: "flexwall", name: "Flex Wall", description: "Complete high-paying offers and premium tasks with Flex Wall", logoUrl: "https://media.licdn.com/dms/image/v2/D4D0BAQGjjGNPMg4b5A/company-logo_200_200/B4DZdj2GDwHAAM-/0/1749726817858/flex_wall_logo?e=2147483647&v=beta&t=FX9Rns8aGV87i0C6XdTSsPag5BpWgXrfFnK38vzM4ts", avgPoints: 2200, isActive: true, url: "#", color: "#6366f1" },
  { id: "cpx", name: "CPX Research", description: "Earn high rewards by participating in premium global surveys with CPX Research", logoUrl: "https://cashlyearn.com/storage/providers/Ba1959cqhHLfqj2QWML7tgDSx4LiBOIdLdO7ePRX.png", avgPoints: 3000, isActive: true, url: "#", color: "#2563eb" },
  { id: "timewall", name: "TimeWall", description: "Complete micro-tasks, clicks, and surveys for instant rewards with TimeWall", logoUrl: "https://gamehag.com/_next/image?url=%2Fimg%2Fofferwalls%2Ftimewall.png&w=1920&q=100", avgPoints: 1500, isActive: true, url: "#", color: "#00b894" },
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
      cpx: `https://offers.cpx-research.com/index.php?app_id=32110&ext_user_id=${uid}`,
      timewall: `https://timewall.io/app/wall?site_id=5d67455ef99682e8&user_id=${uid}`
    };
    return urls[wall.id] || wall.url;
  };

  const pointsPerLevel = 10000;
  const currentLevel = Math.floor((userData?.totalEarned || 0) / pointsPerLevel) + 1;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  if (activeOffer) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        <div className="flex items-center justify-between p-3 bg-[#0d0d0d] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-white"><ArrowLeft className="h-5 w-5" /></Button>
            <span className="font-bold text-white text-sm">{activeOffer.title}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => window.open(activeOffer.url, '_blank')} className="text-white/50"><Maximize2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-white/50"><X className="h-5 w-5" /></Button>
          </div>
        </div>
        <iframe src={activeOffer.url} className="w-full flex-1 border-0" title={activeOffer.title} allow="autoplay; fullscreen" />
      </div>
    );
  }

  return (
    // التعديل: جعلنا الحاوية w-full لإلغاء الفراغات
    <div className="flex flex-col gap-4 w-full"> 
      <LiveFeed />

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 px-4 sm:px-0">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-white/5 border border-white/10 shrink-0">
              <Image src="/coin.png" alt="Coin" width={24} height={24} className="animate-pulse object-contain sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Points Balance</p>
              <p className="text-xl sm:text-2xl font-black text-white truncate">{Number(userData?.points ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-[#A65FFF]/10 border border-[#A65FFF]/20 shrink-0">
              <Trophy className="h-5 sm:h-6 w-5 sm:w-6 text-[#A65FFF]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Current Level</p>
              <p className="text-xl sm:text-2xl font-black text-[#A65FFF]">Level {currentLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 sm:px-0">
        <Card className="border-border bg-[#0D0D0D] border-white/5 w-full">
            <CardContent className="p-3 sm:p-4">
            <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 text-white font-black text-xs sm:text-sm uppercase tracking-wider">
                <Trophy className="h-4 sm:h-5 w-4 sm:w-5 text-[#A65FFF] shrink-0" />
                <span className="truncate">Level {currentLevel} Progress</span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-white/40">{Number(pointsInCurrentLevel).toLocaleString()} / {Number(pointsPerLevel).toLocaleString()}</span>
            </div>
            <div className="h-2 sm:h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] transition-all duration-500 shadow-[0_0_10px_rgba(166,95,255,0.3)]" style={{ width: `${levelProgress}%` }}></div>
            </div>
            </CardContent>
        </Card>
      </div>

      <div className="px-4 sm:px-0">
        <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-black text-white tracking-tight">Earn Points</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? ( <p className="col-span-full text-xs sm:text-sm text-white/50 text-center py-8">Loading...</p> ) : (
            offerwalls.map((wall) => (
              <Card key={wall.id} className="border-border bg-card transition-all hover:border-[#A65FFF]/30">
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <img src={wall.logoUrl} alt={wall.name} className="h-10 sm:h-12 w-10 sm:w-12 rounded-lg sm:rounded-xl object-contain bg-white/5 p-1 shrink-0" />
                    <Badge variant="secondary" className="bg-[#A65FFF]/10 text-[#A65FFF] border border-[#A65FFF]/20 font-bold text-[9px] sm:text-xs px-2 py-1">
                      <Image src="/coin.png" width={10} height={10} alt="coin" className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
                      ~{Number(wall.avgPoints ?? 0).toLocaleString()}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm sm:text-base mt-2 font-black text-white line-clamp-1">{wall.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-[10px] sm:text-xs">{wall.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <Button className="w-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] text-white font-black text-[10px] sm:text-xs h-8 sm:h-10" onClick={() => { const url = getDynamicUrl(wall); if (url !== "#") setActiveOffer({ url, title: wall.name }); }}>
                    START <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

    {/* --- Footer المصلح والكامل العرض --- */}
      <footer className="mt-12 border-t border-white/5 bg-[#080808]/80 pt-12 pb-10 w-full px-4 sm:px-10">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={32} height={32} />
              <span className="text-2xl font-black bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] bg-clip-text text-transparent italic tracking-tighter">
                MrCash
              </span>
            </div>
            <p className="text-[12px] text-slate-500 leading-relaxed font-medium">The premier destination for turning tasks into real digital rewards securely and instantly.</p>
          </div>

          <div className="space-y-5">
            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">Trust</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Encryption</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400"><Globe className="w-4 h-4 text-cyan-500" /> Global Payouts</div>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">Legal</h4>
            <nav className="flex flex-col gap-3">
              {/* تم تعديل الروابط لتطابق روابط موقعك الفعلية */}
              <Link href="/privacy-policy" className="text-[11px] text-slate-500 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-[11px] text-slate-500 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>

          <div className="space-y-5">
            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.2em]">Community</h4>
            <a href="https://t.me/+HaIWYiOHx-FkNzY0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-black border border-white/5 hover:border-cyan-500/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#111] flex items-center justify-center border border-white/5 group-hover:bg-[#0088cc] transition-colors">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-white uppercase">Telegram</span>
                <span className="text-[9px] text-slate-600 font-bold">Official Channel</span>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-slate-700 tracking-[0.5em]">© 2026 MR.CASH • ALL RIGHTS RESERVED</p>
        </div>
      </footer>
