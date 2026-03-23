"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Flame, LayoutGrid, Zap, Coins } from "lucide-react";

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
  // --- المميزة (Featured Partners) ---
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Most Popular 🔥",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    avgPoints: 2000,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(147,51,234,0.5)] border-purple-500",
    category: "featured"
  },
  // --- Offer Partners (شركات العروض العادية) ---
  {
    id: "dtowall",
    name: "adtowall",
    tag: "TrueLeads 🎯",
    logoUrl: "https://bagirawall.com/favicon.ico", // مثال
    avgPoints: 950,
    url: (uid: string) => `#`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(6,182,212,0.5)] border-cyan-500",
    category: "standard"
  },
  {
    id: "pixylabs",
    name: "pixylabs",
    tag: "PureReward 💎",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    avgPoints: 1200,
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(16,185,129,0.5)] border-emerald-500",
    category: "standard"
  }
];

export default function OffersPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  // دالة مساعدة لرسم القسم
  const renderSection = (title: string, icon: any, category: "featured" | "standard") => {
    const filtered = offerwalls.filter(w => w.category === category);
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-6 pt-4">
        {/* العناوين باللون السماوي الخاص بالشعار */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--brand-cyan)]/10">
            {icon}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {title}
          </h2>
        </div>
        
        {/* شبكة العروض بتصميم المربعات الجانبية الاحترافي (طبق الأصل) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-7xl mx-auto">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              className={`relative bg-[#0a0a0a] border border-white/5 rounded-[22px] p-6 cursor-pointer transition-all hover:scale-[1.03] active:scale-95 border-b-2 ${wall.glowColor} group flex items-center gap-6 overflow-hidden`}
            >
              {/* تأثير التوهج الخلفي البنفسجي (طبق الأصل) */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all z-0"></div>
              
              {/* 1. المربع الصغير المتوهج (أيقونة P أو الشعار) */}
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#2A1B4A] border-2 border-purple-900 shadow-xl shadow-purple-500/50 p-2 flex items-center justify-center transition-transform group-hover:scale-105 z-10">
                <img 
                  src={wall.logoUrl} 
                  alt={wall.name} 
                  className="h-full w-full object-contain filter group-hover:brightness-110 transition-all" 
                />
              </div>
              
              {/* 2. النصوص على الجانب (طبق الأصل) */}
              <div className="flex-1 space-y-3 z-10 relative">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-2xl text-white font-extrabold truncate uppercase tracking-tight">{wall.name}</h3>
                  <Badge className="bg-white/10 backdrop-blur-md text-white border-none font-bold rounded-full py-1.5 px-4 text-[10px] tracking-widest uppercase">
                    {wall.tag}
                  </Badge>
                </div>
                
                {/* النجوم الذهبية */}
                <div className="flex gap-1.5 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                  ))}
                </div>
                
                {/* النقاط Up to ... */}
                <div className="flex items-center gap-3 text-emerald-400 font-semibold text-sm">
                  <Coins className="h-5 w-5" />
                  <span>Up to {wall.avgPoints.toLocaleString()} Points</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-16 bg-black text-white">
      
      {/* القسم الأول: الشركات المميزة */}
      {renderSection("Featured Partners", <Flame className="text-[var(--brand-cyan)] h-6 w-6" />, "featured")}

      {/* القسم الثاني: شركات العروض */}
      {renderSection("Offer Partners", <LayoutGrid className="text-[var(--brand-cyan)] h-6 w-6" />, "standard")}

    </div>
  );
}
