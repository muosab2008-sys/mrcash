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
    tagColor: "bg-purple-600/10 text-purple-300 border border-purple-600/20",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    points: 1000,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_4px_12px_-4px_rgba(147,51,234,0.4)] border-purple-500",
    category: "featured"
  },
  // --- Offer Partners (شركات العروض العادية) ---
  {
    id: "bagira",
    name: "adtowall",
    tag: "TrueLeads ✅",
    tagColor: "bg-blue-600/10 text-blue-300 border border-blue-600/20",
    logoUrl: "https://bagirawall.com/favicon.ico",
    points: 800,
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    glowColor: "shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)] border-blue-500",
    category: "standard"
  },
  {
    id: "pixylabs",
    name: "pixylabs",
    tag: "PureReward 💎",
    tagColor: "bg-emerald-600/10 text-emerald-300 border border-emerald-600/20",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    points: 750,
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] border-emerald-500",
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
      <div className="space-y-5 pt-2">
        {/* عنوان القسم - تم تصغير الخط قليلاً */}
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">{title}</h2>
        </div>
        
        {/* شبكة العروض - عرض الكروت لتعطي شكل المستطيل الأفقي */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              // الإضافة السحرية: h-28 تجعل المستطيل نحيفاً جداً وأنيقاً
              className={`relative bg-[#0a0a0a] h-28 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all hover:scale-102 hover:border-white/10 active:scale-98 border-b-2 ${wall.glowColor} group flex items-center gap-4`}
            >
              {/* Badge - التاج العلوي في الزاوية - تم تصغيره */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <Badge className={`${wall.tagColor} text-[9px] px-2 py-0.5 rounded-full border-none font-bold uppercase`}>
                  {wall.tag}
                </Badge>
              </div>

              {/* Logo Section - الأيقونة تم تصغيرها لـ h-16 w-16 */}
              <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center rounded-xl bg-black border border-white/5 p-1.5">
                <img 
                  src={wall.logoUrl} 
                  alt={wall.name} 
                  className="max-h-full max-w-full object-contain filter group-hover:brightness-125 transition-all" 
                />
              </div>

              {/* Info Section - البيانات بجانب الأيقونة - تم تصغير الخطوط */}
              <div className="flex-1 space-y-1">
                <h3 className="text-white font-black text-lg truncate uppercase tracking-tight">{wall.name}</h3>
                
                {/* Stars - النجوم تم تصغيرها */}
                <div className="flex gap-0.5 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < 4 ? "fill-yellow-500 text-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                  ))}
                </div>

                {/* Points - النقاط تم تصغيرها */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-1.5">
                    <Zap className="h-3 w-3 text-emerald-500" />
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
    <div className="p-4 md:p-8 min-h-screen space-y-10 bg-black text-white max-w-7xl mx-auto">
      {/* 1. Featured Section */}
      {renderSection("Featured Partners", <Flame className="text-purple-500 h-6 w-6" />, "featured")}

      {/* 2. Offer Partners Section */}
      {renderSection("Offer Partners", <LayoutGrid className="text-emerald-500 h-6 w-6" />, "standard")}
    </div>
  );
}
