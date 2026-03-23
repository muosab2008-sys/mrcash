"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Flame, LayoutGrid } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  logoUrl: string;
  url: any;
  glowColor: string; 
  category: "featured" | "standard";
}

const defaultOfferwalls: Offerwall[] = [
  // --- Featured Partners (الشركات المميزة) ---
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Popular 🔥",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_8px_25px_-5px_rgba(147,51,234,0.6)] border-purple-900",
    category: "featured"
  },
  // --- Offer Partners (شركات العروض العادية) ---
  {
    id: "pixylabs",
    name: "PixyLabs",
    tag: "Surveys 💎",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_8px_25px_-5px_rgba(6,182,212,0.6)] border-cyan-900",
    category: "standard"
  },
  {
    id: "mylead",
    name: "MyLead",
    tag: "Exclusive 🎯",
    logoUrl: "https://mylead.global/favicon.ico",
    url: (uid: string) => `https://mylead.global/sl/YOUR_LINK?ml_sub1=${uid}`,
    glowColor: "shadow-[0_8px_25px_-5px_rgba(37,99,235,0.6)] border-blue-900",
    category: "standard"
  }
];

export default function OffersPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  const renderSection = (title: string, icon: any, category: "featured" | "standard") => {
    const filtered = offerwalls.filter(w => w.category === category);
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-6">
        {/* العناوين باللون السماوي الخاص بالشعار */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--brand-cyan)]/10 border border-[var(--brand-cyan)]/20">
            {icon}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {title}
          </h2>
        </div>
        
        {/* Grid Layout - المربعات الاحترافية */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              // الإضافة السحرية: aspect-square تجعل البطاقة مربعة تماماً
              className={`relative group bg-[#000000] aspect-square border-2 border-white/5 rounded-[28px] p-5 cursor-pointer transition-all duration-300 hover:scale-[1.05] active:scale-95 flex flex-col justify-between ${wall.glowColor}`}
            >
              {/* Badge العلوي */}
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-white/5 backdrop-blur-sm text-[9px] px-2 py-0.5 rounded-lg border border-white/10 text-gray-300 font-bold uppercase tracking-widest">
                  {wall.tag}
                </Badge>
              </div>

              {/* Logo Section - أيقونة الشركة (في منتصف المربع) */}
              <div className="flex-1 flex items-center justify-center mt-6">
                <img 
                  src={wall.logoUrl} 
                  alt={wall.name} 
                  className="max-h-[60px] max-w-[80%] object-contain filter group-hover:brightness-125 transition-all" 
                />
              </div>

              {/* Info Section - الاسم والنجوم (في أسفل المربع) */}
              <div className="space-y-1.5 border-t border-white/5 pt-4">
                <h3 className="text-white font-black text-sm truncate uppercase tracking-tight text-center">{wall.name}</h3>
                
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
    <div className="p-6 md:p-10 min-h-screen space-y-16">
      
      {/* القسم الأول: الشركات المميزة */}
      {renderSection("Featured Partners", <Flame className="text-[var(--brand-cyan)] h-6 w-6" />, "featured")}

      {/* القسم الثاني: شركات العروض */}
      {renderSection("Offer Partners", <LayoutGrid className="text-[var(--brand-cyan)] h-6 w-6" />, "standard")}

    </div>
  );
}
