"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Flame, LayoutGrid, ClipboardList } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  logoUrl: string;
  url: any;
  glowColor: string; 
  category: "featured" | "standard" | "surveys";
}

const defaultOfferwalls: Offerwall[] = [
  // --- المميزة (Featured) ---
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Most Popular 🔥",
    tagColor: "bg-purple-600",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(147,51,234,0.5)] border-b-purple-500",
    category: "featured"
  },
  // --- العادية (Standard) ---
  {
    id: "bagirawall",
    name: "Bagira Wall",
    tag: "Easy Tasks ✅",
    tagColor: "bg-blue-600",
    logoUrl: "https://bagirawall.com/favicon.ico",
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(37,99,235,0.5)] border-b-blue-500",
    category: "standard"
  },
  {
    id: "mylead",
    name: "MyLead",
    tag: "Exclusive 🎯",
    tagColor: "bg-indigo-600",
    logoUrl: "https://mylead.global/favicon.ico",
    url: (uid: string) => `https://mylead.global/sl/YOUR_LINK?ml_sub1=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(79,70,229,0.5)] border-b-indigo-500",
    category: "standard"
  },
  // --- الاستطلاعات (Surveys) ---
  {
    id: "pixylabs",
    name: "PixyLabs",
    tag: "Best Surveys 💎",
    tagColor: "bg-emerald-600",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_4px_15px_-3px_rgba(16,185,129,0.5)] border-b-emerald-500",
    category: "surveys"
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  // دالة مساعدة لرسم القسم
  const renderSection = (title: string, icon: any, category: string) => {
    const filtered = offerwalls.filter(w => w.category === category);
    if (filtered.length === 0) return null;

    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2 border-l-4 border-white/20 pl-4">
          {icon}
          <h2 className="text-xl font-black text-white uppercase tracking-wider">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              className={`relative bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 cursor-pointer transition-all hover:scale-105 active:scale-95 border-b-2 ${wall.glowColor}`}
            >
              <div className="absolute top-2 right-2">
                <Badge className={`${wall.tagColor} text-[9px] px-2 py-0.5 rounded-full border-none text-white font-bold`}>
                  {wall.tag}
                </Badge>
              </div>
              <div className="h-16 flex items-center mb-4 mt-2">
                <img src={wall.logoUrl} alt={wall.name} className="max-h-full max-w-[80%] object-contain" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm truncate uppercase tracking-tight">{wall.name}</h3>
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
  };

  return (
    <div className="p-6 min-h-screen space-y-12">
      {/* 1. Featured Section */}
      {renderSection("Featured Providers", <Flame className="text-orange-500 h-6 w-6" />, "featured")}

      {/* 2. Standard Section */}
      {renderSection("Standard Offers", <LayoutGrid className="text-blue-500 h-6 w-6" />, "standard")}

      {/* 3. Survey Section */}
      {renderSection("Survey Walls", <ClipboardList className="text-emerald-500 h-6 w-6" />, "surveys")}
    </div>
  );
}
