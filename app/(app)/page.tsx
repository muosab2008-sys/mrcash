"use client";

// إجبار الصفحة على التحميل الديناميكي (لضمان تحديث العروض)
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, Trophy, X, ArrowLeft, Maximize2, 
  DollarSign, Send, Zap, Gamepad2, ClipboardList 
} from "lucide-react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

// --- مكون الـ Live Feed (الشريط العلوي المتحرك) ---
function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);

  useEffect(() => {
    // جلب آخر 15 عملية سحب/ربح من Firebase
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching live feed:", error);
    });
    return () => unsubscribe();
  }, []);

  if (feedItems.length === 0) return null;

  return (
    <div className="w-full flex justify-center py-2 bg-transparent select-none relative z-40">
      <div className="relative flex items-center h-12 w-full bg-[#0d0d0d]/80 backdrop-blur-md rounded-full border border-white/5 shadow-2xl overflow-visible">
        {/* كلمة LIVE ثابتة على اليسار */}
        <div className="absolute left-0 z-[60] bg-[#0d0d0d] px-5 h-full flex items-center border-r border-white/5 rounded-l-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Live Feed
            </span>
          </div>
        </div>

        {/* المحتوى المتحرك (المستخدمين والأرباح) */}
        <div className="flex-1 h-full overflow-hidden rounded-full ml-28 relative z-10">
          <div className="flex whitespace-nowrap items-center h-full animate-scroll group hover:[animation-play-state:paused]">
            {[...feedItems, ...feedItems].map((item, index) => {
              const itemId = `${item.id}-${index}`;
              return (
                <div key={itemId} className="relative inline-flex items-center gap-3 px-6 border-r border-white/5 h-full">
                  <Avatar className="h-7 w-7 border border-white/10">
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
                </div>
              );
            })}
          </div>
        </div>
        {/* تأثير التلاشي على اليمين */}
        <div className="absolute right-0 top-0 bottom-0 w-20 z-20 bg-gradient-to-l from-[#0d0d0d] to-transparent pointer-events-none rounded-r-full" />
      </div>

      <style jsx>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 40s linear infinite; }
      `}</style>
    </div>
  );
}

// --- تعريف واجهة الـ Offerwall ---
interface Offerwall {
  id: string; name: string; description: string; logoUrl: string;
  avgPoints: number; isActive: boolean; url: string; color: string;
}

// --- العروض الافتراضية (تظهر في حال لم يتم تحميل البيانات من Firebase) ---
const defaultOfferwalls: Offerwall[] = [
  { id: "playtime", name: "PlayTimeAds", description: "Play games and complete tasks to earn high rewards", logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp", avgPoints: 1200, isActive: true, url: "#", color: "#9333ea" },
  { id: "pubscale", name: "PubScale", description: "Discover new apps and complete quick offers", logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp", avgPoints: 850, isActive: true, url: "#", color: "#2563eb" },
  { id: "gemiad", name: "GemiAd", description: "Access the highest paying tasks and complete instant surveys", logoUrl: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png", avgPoints: 1500, isActive: true, url: "#", color: "#ff5722" },
  { id: "revtoo", name: "Revtoo", description: "Maximize your earnings with high-reward premium offers", logoUrl: "https://revtoo.com/assets/offerwall/images/revtoo-dark.svg", avgPoints: 1800, isActive: true, url: "#", color: "#0ea5e9" },
];

// --- المكون الرئيسي لصفحة الـ Earn ---
export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState<{url: string, title: string} | null>(null);

  // جلب العروض من Firebase
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

  // دالة لتوليد الرابط الديناميكي لكل مستخدم
  const getDynamicUrl = (wall: Offerwall) => {
    if (!userData?.uid) return "#";
    const uid = userData.uid;
    const urls: Record<string, string> = {
      playtime: `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
      pubscale: `https://wow.pubscale.com?app_id=99429038&user_id=${uid}`,
      gemiad: `https://gemiwall.com/69c1622e82a1cd59c17a2e21/${uid}`,
      revtoo: `https://revtoo.com/offerwall/xol9xws01wsarkpuv7miwdair6ikvu/${uid}`,
    };
    return urls[wall.id] || wall.url;
  };

  // حساب المستوى والتقدم
  const pointsPerLevel = 10000;
  const currentLevel = Math.floor((userData?.totalEarned || 0) / pointsPerLevel) + 1;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  // عرض الـ Iframe عند فتح العرض
  if (activeOffer) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        <div className="flex items-center justify-between p-3 bg-[#0d0d0d] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-bold text-white text-sm">{activeOffer.title}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => window.open(activeOffer.url, '_blank')} className="text-white/50">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-white/50">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <iframe src={activeOffer.url} className="w-full flex-1 border-0" title={activeOffer.title} allow="autoplay; fullscreen" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full min-h-full pb-6">
      <LiveFeed />

      {/* الرصيد والمستوى */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 shrink-0">
              <Image src="/coin.png" alt="Coin" width={28} height={28} className="animate-pulse object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground font-medium text-left">Points Balance</p>
              <p className="text-2xl font-black text-white truncate text-left">
                {Number(userData?.points ?? 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#A65FFF]/10 border border-[#A65FFF]/20 shrink-0">
              <Trophy className="h-6 w-6 text-[#A65FFF]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground font-medium text-left">Current Level</p>
              <p className="text-2xl font-black text-[#A65FFF] text-left">Level {currentLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شريط تقدم المستوى */}
      <Card className="border-border bg-[#0D0D0D] border-white/5">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="h-5 w-5 text-[#A65FFF] shrink-0" />
              <span className="font-black text-sm text-white uppercase tracking-wider truncate">Level {currentLevel} Progress</span>
            </div>
            <span className="text-xs font-bold text-white/40 whitespace-nowrap">
              {Number(pointsInCurrentLevel).toLocaleString()} / {Number(pointsPerLevel).toLocaleString()}
            </span>
          </div>
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] transition-all duration-500 shadow-[0_0_10px_rgba(166,95,255,0.3)]" style={{ width: `${levelProgress}%` }}></div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة العروض */}
      <div>
        <h2 className="mb-4 text-xl font-black text-white tracking-tight text-left">Earn Points</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
              <p className="col-span-full text-sm text-white/50 text-center py-10">Loading Offerwalls...</p>
          ) : (
            offerwalls.map((wall) => (
              <Card key={wall.id} className="border-border bg-card transition-all hover:border-[#A65FFF]/30">
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <img src={wall.logoUrl} alt={wall.name} className="h-12 w-12 rounded-xl object-contain bg-white/5 p-1 shrink-0" />
                    <Badge variant="secondary" className="bg-[#A65FFF]/10 text-[#A65FFF] border border-[#A65FFF]/20 flex items-center gap-1 font-bold text-xs px-2 py-1 shrink-0">
                      <Image src="/coin.png" width={12} height={12} alt="coin" className="w-4 h-4" />
                      <span className="truncate">~{Number(wall.avgPoints ?? 0).toLocaleString()}</span>
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3 font-black text-white text-left line-clamp-1">{wall.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-left">{wall.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 px-4 pb-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] text-white font-black text-xs hover:opacity-90 active:scale-95 border-none shadow-lg shadow-purple-500/10 h-10" 
                    onClick={() => {
                      const url = getDynamicUrl(wall);
                      if (url !== "#") setActiveOffer({ url, title: wall.name });
                    }}
                  >
                    START <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* --- قسم الفوتر السفلي (الجديد والمعدل بالكامل ليكون نفس الصورة) --- */}
      <div className="mt-12 pt-8 border-t border-white/5 relative z-10 px-4">
        <div className="flex flex-col gap-8">
          
          {/* الطبقة العلوية: اللوجو + الوصف + الروابط */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            
            {/* العمود 1: الهوية (اللوجو والاسم والوصف) */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {/* اللوجو بتأثير الألوان الخاص بك */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#A65FFF] flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black bg-gradient-to-r from-[#00D2FF] to-[#A65FFF] bg-clip-text text-transparent tracking-tighter">
                    MrCash
                  </span>
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest -mt-1">Authorized Platform</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-sm">
                MrCash هي منصتك الموثوقة لتحويل وقتك إلى أرباح حقيقية من خلال إكمال المهام الرقمية وتجربة الألعاب والاستطلاعات.
              </p>
            </div>

            {/* العمود 2: الصفحات القانونية (نسخ لصق للروابط) */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">LEGAL PAGES</p>
              <a href="/terms-of-service" className="text-[11px] text-slate-500 hover:text-purple-400 font-medium transition-colors">Terms of Service</a>
              <a href="/privacy-policy" className="text-[11px] text-slate-500 hover:text-purple-400 font-medium transition-colors">Privacy Policy</a>
              <a href="/" className="text-[11px] text-slate-500 hover:text-purple-400 font-medium transition-colors">Home</a>
            </div>

            {/* العمود 3: زر التيليجرام الفخم (نفس الصورة تماماً) */}
            <div className="flex flex-col gap-3 lg:items-end">
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">CONNECT WITH US</p>
              
              <a 
                href="https://t.me/+HaIWYiOHx-FkNzY0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-[#00D2FF]/10 hover:border-[#00D2FF]/20 transition-all duration-300 group w-full max-w-xs shadow-lg shadow-black/20"
              >
                {/* أيقونة الإرسال بتأثير الصورة */}
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500 transition-colors shrink-0">
                  <Send className="w-5 h-5 text-cyan-400 group-hover:text-white" />
                </div>
                
                {/* النصوص المزدوجة على اليسار */}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">Telegram</span>
                  <span className="text-[10px] text-slate-500 font-medium">انضم لمجتمعنا الخاص</span>
                </div>
              </a>
            </div>
          </div>

          {/* الشريط السفلي جداً (حقوق النشر والخط الجمالي) */}
          <div className="pt-6 pb-2 text-center relative">
            {/* خط جمالي خفيف */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent absolute top-0 left-0"></div>
            
            <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">
              © 2026 MR.CASH. ALL RIGHTS RESERVED.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
