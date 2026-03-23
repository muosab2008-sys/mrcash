"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Flame, LayoutGrid, Zap } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  logoUrl: string;
  points: number;
  url: any;
  glowColor: string; 
  category: "featured" | "standard";
}

const defaultOfferwalls: Offerwall[] = [
  // --- Featured Partners (الشركات المميزة) ---
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Trendify 🔥",
    tagColor: "bg-purple-600/20 text-purple-300 border border-purple-600/30",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    points: 1000,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(147,51,234,0.5)] border-purple-500",
    category: "featured"
  },
  // --- Offer Partners (شركات العروض العادية) ---
  {
    id: "bagira",
    name: "adtowall",
    tag: "TrueLeads ✅",
    tagColor: "bg-blue-600/20 text-blue-300 border border-blue-600/30",
    logoUrl: "https://bagirawall.com/favicon.ico",
    points: 800,
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(37,99,235,0.5)] border-blue-500",
    category: "standard"
  },
  {
    id: "pixylabs",
    name: "pixylabs",
    tag: "PureReward 💎",
    tagColor: "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    points: 750,
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(16,185,129,0.5)] border-emerald-500",
    category: "standard"
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  // دالة مساعدة لرسم القسم
  const renderSection = (title: string, icon: any, category: "featured" | "standard") => {
    const filtered = offerwalls.filter(w => w.category === category);
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-6 pt-4">
        {/* عنوان القسم */}
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{title}</h2>
        </div>
        
        {/* شبكة العروض - عرض الكروت لتعطي شكل المستطيل الأفقي */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              // تصميم المستطيل الأفقي (bg-[#0a0a0a]) مع الحدود الملونة المتوهجة
              className={`relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 cursor-pointer transition-all hover:scale-102 hover:border-white/10 active:scale-98 border-b-2 ${wall.glowColor} group flex items-center gap-5`}
            >
              {/* Badge - التاج العلوي في الزاوية */}
              <div className="absolute top-3 right-3 z-10">
                <Badge className={`${wall.tagColor} text-[10px] px-2.5 py-1 rounded-full border-none font-bold`}>
                  {wall.tag}
                </Badge>
              </div>

              {/* Logo Section - الأيقونة */}
              <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center rounded-xl bg-black border border-white/5 p-2">
                <img 
                  src={wall.logoUrl} 
                  alt={wall.name} 
                  className="max-h-full max-w-full object-contain filter group-hover:brightness-125 transition-all" 
                />
              </div>

              {/* Info Section - البيانات بجانب الأيقونة */}
              <div className="flex-1 space-y-2">
                <h3 className="text-white font-black text-xl truncate uppercase tracking-tight">{wall.name}</h3>
                
                {/* Stars - النجوم */}
                <div className="flex gap-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-yellow-500 text-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                  ))}
                </div>

                {/* Points - النقاط */}
                <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mt-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span>~{wall.points.toLocaleString()} pts</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 min-h-screen space-y-12 bg-black text-white">
      {/* 1. Featured Section */}
      {renderSection("Featured Partners", <Flame className="text-purple-500 h-7 w-7" />, "featured")}

      {/* 2. Offer Partners Section */}
      {renderSection("Offer Partners", <LayoutGrid className="text-emerald-500 h-7 w-7" />, "standard")}
    </div>
  );
}
