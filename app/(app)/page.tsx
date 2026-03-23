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
  isActive: boolean;
  url: any;
  glowColor: string; // اللون المتوهج أسفل المربع
}

const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Trendify 🔥",
    tagColor: "bg-purple-600",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    isActive: true,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(147,51,234,0.5)] border-b-purple-500",
  },
  {
    id: "pixylabs",
    name: "pixylabs",
    tag: "PureReward 💎",
    tagColor: "bg-emerald-600",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    isActive: true,
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(16,185,129,0.5)] border-b-emerald-500",
  },
  {
    id: "dtowall",
    name: "adtowall",
    tag: "TrueLeads 🎯",
    tagColor: "bg-blue-600",
    logoUrl: "https://bagirawall.com/favicon.ico", // مثال
    isActive: true,
    url: (uid: string) => `#`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(37,99,235,0.5)] border-b-blue-500",
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  return (
    <div className="p-6 bg-black min-h-screen">
      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-8">Earn Points</h2>

      {/* Grid Layout - المربعات الصغيرة */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {offerwalls.map((wall) => (
          <Card 
            key={wall.id}
            onClick={() => {
                const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                window.open(finalUrl, "_blank");
            }}
            className={`relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 cursor-pointer transition-all hover:scale-105 active:scale-95 border-b-2 ${wall.glowColor}`}
          >
            {/* Badge - التاج العلوي */}
            <div className="absolute top-2 right-2">
              <Badge className={`${wall.tagColor} text-[10px] px-2 py-0.5 rounded-full border-none text-white`}>
                {wall.tag}
              </Badge>
            </div>

            {/* Logo Section */}
            <div className="h-16 flex items-center mb-4 mt-2">
              <img 
                src={wall.logoUrl} 
                alt={wall.name} 
                className="max-h-full max-w-[80%] object-contain"
              />
            </div>

            {/* Info Section */}
            <div className="space-y-1">
              <h3 className="text-white font-bold text-sm truncate">{wall.name}</h3>
              
              {/* Stars - النجوم */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < 4 ? "fill-yellow-500 text-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
