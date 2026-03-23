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
  url: any;
  glowClass: string; 
  category: "featured" | "standard";
}

const defaultOfferwalls: Offerwall[] = [
  // --- Featured Partners (الشركات المميزة) ---
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Most Popular 🔥",
    tagColor: "bg-purple-600/20 text-purple-300 border border-purple-600/30",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowClass: "shadow-[0_4px_15px_-3px_rgba(147,51,234,0.5)] border-b-purple-500",
    category: "featured"
  },
  // --- Offer Partners (شركات العروض العادية) ---
  {
    id: "dtowall",
    name: "Adtowall",
    tag: "TrueLeads 🎯",
    tagColor: "bg-blue-600/20 text-blue-300 border border-blue-600/30",
    logoUrl: "https://bagirawall.com/favicon.ico",
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    glowClass: "shadow-[0_4px_15px_-3px_rgba(37,99,235,0.5)] border-b-blue-500",
    category: "standard"
  },
  {
    id: "pixylabs",
    name: "pixylabs",
    tag: "PureReward 💎",
    tagColor: "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowClass: "shadow-[0_4px_15px_-3px_rgba(16,185,129,0.5)] border-b-emerald-500",
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
        
        {/* Grid Layout - المربعات الصغيرة الاحترافية (طبق الأصل) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              // تصميم المربعات الصغيرة (aspect-square) مع الحدود الملونة المتوهجة
              className={`relative group bg-[#000000] aspect-square border-2 border-white/5 rounded-[24px] p-5 cursor-pointer transition-all duration-300 hover:scale-[1.05] active:scale-95 border-b-[3px] ${wall.glowClass}`}
            >
              {/* Badge العلوي */}
              <div className="absolute top-3 right-3 z-10">
                <Badge className={`${wall.tagColor} text-[9px] px-2 py-0.5 rounded-lg border-none text-white font-bold uppercase tracking-widest`}>
                  {wall.tag}
                </Badge>
              </div>

              {/* Logo Section - أيقونة الشركة في منتصف المربع */}
              <div className="flex-1 flex items-center justify-center mt-6 h-16 w-16 mx-auto">
                <img 
                  src={wall.logoUrl} 
                  alt={wall.name} 
                  className="max-h-full max-w-full object-contain filter group-hover:brightness-125 transition-all" 
                />
              </div>

              {/* Info Section - الاسم والنجوم في أسفل المربع */}
              <div className="space-y-1.5 border-t border-white/5 pt-4">
                <h3 className="text-white font-black text-sm truncate uppercase tracking-tight text-center">{wall.name}</h3>
                
                {/* Stars - النجوم الذهبية */}
                <div className="flex gap-0.5 text-yellow-500 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < 4 ? "fill-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                  ))}
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
