"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Flame, LayoutGrid, Zap, ExternalLink, X, Loader2 } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  logoUrl: string;
  url: any;
  // ألوان التوهج البنفسجي (طبق الأصل)
  cardGlow: string; 
  bottomGlow: string;
  iconBeam: string;
  category: "featured" | "standard";
}

const defaultOfferwalls: Offerwall[] = [
  // --- المميزة (Featured Partners) ---
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Trendify 🔥",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    // توهج أرجواني عميق
    cardGlow: "shadow-[0_0_50px_rgba(147,51,234,0.15)]",
    bottomGlow: "border-b-[4px] border-b-purple-500",
    iconBeam: "from-purple-600/30 to-transparent",
    category: "featured"
  },
  // --- العادية (Offer Partners) ---
  {
    id: "dtowall",
    name: "adtowall",
    tag: "TrueLeads 🎯",
    logoUrl: "https://bagirawall.com/favicon.ico",
    url: (uid: string) => `#`,
    // توهج سماوي (طبق الأصل)
    cardGlow: "shadow-[0_0_50px_rgba(6,182,212,0.15)]",
    bottomGlow: "border-b-[4px] border-b-cyan-500",
    iconBeam: "from-cyan-600/30 to-transparent",
    category: "standard"
  },
  {
    id: "pixylabs",
    name: "pixylabs",
    tag: "PureReward 💎",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(16,185,129,0.5)] border-b-emerald-500",
    // توهج زمردي (طبق الأصل)
    cardGlow: "shadow-[0_0_50px_rgba(16,185,129,0.15)]",
    bottomGlow: "border-b-[4px] border-b-emerald-500",
    iconBeam: "from-emerald-600/30 to-transparent",
    category: "standard"
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [selectedOfferwallUrl, setSelectedOfferwallUrl] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);

  // دالة لفتح العرض داخل Iframe
  const openOfferwall = (wall: Offerwall) => {
    const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
    setIframeLoading(true);
    setSelectedOfferwallUrl(finalUrl);
  };

  // دالة مساعدة لرسم القسم
  const renderSection = (title: string, icon: any, category: "featured" | "standard") => {
    const filtered = offerwalls.filter(w => w.category === category);
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-10 pt-4">
        {/* العناوين بالأزرق السماوي (var(--brand-cyan)) الخاص بشعارك */}
        <div className="flex items-center gap-3 border-l-4 border-[var(--brand-cyan)] pl-4">
          <div className="p-2.5 rounded-2xl bg-[var(--brand-cyan)]/10">
            {icon}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {title}
          </h2>
        </div>
        
        {/* Grid Layout - البطاقات العمودية العميقة (Portrait) طبق الأصل من الصورة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => openOfferwall(wall)}
              // تصميم البطاقة العمودية العميقة المتوهجة
              className={`relative group bg-[#050505] border-2 border-white/5 rounded-[40px] p-8 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 border-b-[4px] ${wall.bottomGlow} ${wall.cardGlow} overflow-hidden flex flex-col items-center text-center aspect-[1/1.5]`}
            >
              {/* التوهج الخلفي البنفسجي (Glow) طبق الأصل من الصورة */}
              <div className="absolute top-10 w-40 h-40 bg-purple-600/10 blur-[60px] rounded-full group-hover:bg-purple-600/20 transition-all z-0"></div>

              {/* تأثير "شعاع الضوء" (Beam) خلف الأيقونة */}
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-56 bg-gradient-radial ${wall.iconBeam} rounded-full blur-3xl z-0`}></div>
              
              {/* Badge العلوي */}
              <div className="absolute top-5 right-5 z-10">
                <Badge className="bg-[#6A3AB1] text-white text-[11px] px-4 py-2 rounded-full border-none font-bold uppercase tracking-widest">
                  {wall.tag}
                </Badge>
              </div>

              {/* الأيقونة الدائرية الضخمة (طبق الأصل من الصورة P) */}
              <div className="relative z-10 h-36 w-36 rounded-full border-[7px] border-[#1a102d] bg-[#0a0a0a] p-1.5 shadow-2xl transition-transform group-hover:scale-105">
                <img 
                src={wall.logoUrl} 
                alt={wall.name} 
                className="h-full w-full object-contain rounded-full" 
                />
              </div>

              {/* المعلومات باللون الأبيض العريض والكبير (طبق الأصل) */}
              <div className="mt-10 space-y-4 z-10 w-full flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-3xl text-white font-black uppercase tracking-tight italic">
                    {wall.name}
                  </h3>
                  
                  {/* النجوم الذهبية */}
                  <div className="flex gap-1.5 text-yellow-500 justify-center mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < 4 ? "fill-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                    ))}
                  </div>
                </div>

                {/* Zap Points */}
                <div className="flex items-center justify-center gap-3 text-emerald-400 font-bold text-sm mt-5 bg-white/5 py-2.5 rounded-xl border border-white/5">
                  <Zap className="h-4 w-4" />
                  <span>Up to 2,000 Points</span>
                </div>
              </div>

              {/* زر التشغيل في الأسفل */}
              <Button
                className="mt-12 w-full brand-gradient text-white font-black h-14 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 z-10 text-base"
                onClick={(e) => {
                  e.stopPropagation(); // لمنع تشغيل حدث الـ Card onClick
                  openOfferwall(wall);
                }}
              >
                Start Earning
                <ExternalLink className="ml-2.5 h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-20 bg-black text-white">
      
      {/* القسم الأول: الشركات المميزة */}
      {renderSection("Featured Partners", <Flame className="text-[var(--brand-cyan)] h-7 w-7" />, "featured")}

      {/* القسم الثاني: شركات العروض */}
      {renderSection("Offer Partners", <LayoutGrid className="text-[var(--brand-cyan)] h-7 w-7" />, "standard")}

      {/* --- نافذة عرض العروض (Iframe Modal) --- */}
      <Dialog open={!!selectedOfferwallUrl} onOpenChange={() => setSelectedOfferwallUrl(null)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 bg-black/95 backdrop-blur-lg border-white/10 overflow-hidden rounded-3xl">
          
          <DialogHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <img 
                src={defaultOfferwalls[0].logoUrl} 
                alt="Logo" 
                className="h-8 w-8 object-contain rounded-full bg-white/5 p-0.5" 
              />
                PlayTimeAds Offerwall
            </DialogTitle>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedOfferwallUrl(null)}
                className="text-gray-400 hover:text-white rounded-full hover:bg-white/10 h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>
          
          <div className="relative w-full h-[calc(95vh-73px)] overflow-hidden">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-4 z-10">
                <Loader2 className="h-10 w-10 text-[var(--brand-cyan)] animate-spin" />
                <p className="text-gray-400">Loading Offerwall...</p>
              </div>
            )}
            {selectedOfferwallUrl && (
              <iframe 
                src={selectedOfferwallUrl} 
                className="w-full h-full border-none"
                onLoad={() => setIframeLoading(false)}
                title="Offerwall Container"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
