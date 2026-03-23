"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Flame, LayoutGrid, ExternalLink, Coins } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  logoUrl: string;
  avgPoints: number;
  url: any;
  glowColor: string; 
  category: "featured" | "standard";
}

const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Trending 🔥",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    avgPoints: 5000,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_0_20px_rgba(147,51,234,0.3)] border-purple-500/50",
    category: "featured"
  },
  {
    id: "pixylabs",
    name: "PixyLabs",
    tag: "High Payout",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    avgPoints: 3200,
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_0_20px_rgba(6,182,212,0.3)] border-cyan-500/50",
    category: "standard"
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  const renderSection = (title: string, icon: any, category: "featured" | "standard") => {
    const filtered = offerwalls.filter(w => w.category === category);
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-8">
        {/* العنوان باللون السماوي (Cyan) مطابق لشعارك */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            {icon}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
        </div>
        
        {/* Grid: مستطيلات عمودية احترافية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              className={`relative bg-[#050505] border-2 ${wall.glowColor} rounded-[35px] p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] group overflow-hidden`}
            >
              {/* Badge العلوي */}
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-[#6A3AB1] text-white border-none font-bold rounded-full py-1 px-3 text-[10px]">
                  {wall.tag}
                </Badge>
              </div>

              {/* تأثير النور خلف الأيقونة */}
              <div className="absolute top-10 w-32 h-32 bg-purple-600/20 blur-[50px] rounded-full group-hover:bg-purple-600/30 transition-all"></div>

              {/* الأيقونة الدائرية الكبيرة (طبق الأصل) */}
              <div className="relative z-10 h-28 w-28 rounded-full border-[6px] border-[#1a102d] bg-[#0a0a0a] p-1 shadow-2xl transition-transform group-hover:scale-110">
                <img 
                  src={wall.logoUrl} 
                  alt={wall.name} 
                  className="h-full w-full object-contain rounded-full" 
                />
              </div>

              {/* المعلومات */}
              <div className="mt-6 space-y-3 z-10 w-full">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                  {wall.name}
                </h3>
                
                {/* النجوم */}
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-zinc-800 text-zinc-800"}`} />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                  <Coins className="h-4 w-4" />
                  <span>Up to {wall.avgPoints.toLocaleString()} Points</span>
                </div>
              </div>

              {/* زر التشغيل الأسفل */}
              <Button
                className="mt-8 w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black h-12 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40"
                onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
                }}
              >
                START EARNING
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-black space-y-20">
      {renderSection("Featured Partners", <Flame className="text-cyan-400 h-7 w-7" />, "featured")}
      renderSection("Offer Partners", <LayoutGrid className="text-cyan-400 h-7 w-7" />, "standard")}
    </div>
  );
}
