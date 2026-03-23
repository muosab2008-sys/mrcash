"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  logoUrl: string;
  url: any;
  glowClass: string; 
}

const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Trendify 🔥",
    tagColor: "bg-[#7c3aed]", // بنفسجي مطابق للوجو
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowClass: "shadow-[0_0_15px_-5px_#7c3aed] border-b-[#7c3aed]",
  },
  {
    id: "pixylabs",
    name: "pixylabs",
    tag: "PureReward 💎",
    tagColor: "bg-[#10b981]", // أخضر زمردي
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowClass: "shadow-[0_0_15px_-5px_#10b981] border-b-[#10b981]",
  },
  {
    id: "dtowall",
    name: "adtowall",
    tag: "TrueLeads 🎯",
    tagColor: "bg-[#2563eb]", // أزرق ملكي
    logoUrl: "https://bagirawall.com/favicon.ico",
    url: (uid: string) => `#`,
    glowClass: "shadow-[0_0_15px_-5px_#2563eb] border-b-[#2563eb]",
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      {/* Title */}
      <h2 className="text-3xl font-black mb-10 tracking-tight">Earn Points</h2>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {offerwalls.map((wall) => (
          <Card 
            key={wall.id}
            onClick={() => {
                const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                window.open(finalUrl, "_blank");
            }}
            className={`group relative bg-black border border-white/5 rounded-[22px] p-5 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 border-b-[3px] ${wall.glowClass}`}
          >
            {/* Badge */}
            <div className="absolute top-3 right-3 z-10">
              <Badge className={`${wall.tagColor} text-[10px] font-bold px-2.5 py-1 rounded-lg border-none text-white shadow-lg`}>
                {wall.tag}
              </Badge>
            </div>

            {/* Logo Section */}
            <div className="h-20 flex items-center justify-start mb-6 mt-4">
              <img 
                src={wall.logoUrl} 
                alt={wall.name} 
                className="max-h-full max-w-[85%] object-contain filter brightness-110 group-hover:brightness-125 transition-all"
              />
            </div>

            {/* Content Section */}
            <div className="space-y-2">
              <h3 className="text-white font-extrabold text-lg tracking-wide uppercase italic">{wall.name}</h3>
              
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3.5 w-3.5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-zinc-800 text-zinc-800"}`} 
                  />
                ))}
              </div>
            </div>

            {/* Hover Glow Effect Layer */}
            <div className="absolute inset-0 rounded-[22px] bg-gradient-to-b from-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
