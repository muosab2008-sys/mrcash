"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Zap, ShieldCheck, Clock, MousePointer2 } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  logoUrl: string;
  isActive: boolean;
  url: any;
  glowColor: string; 
}

const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Most Popular 🔥",
    tagColor: "bg-purple-600",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    isActive: true,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "shadow-[0_8px_20px_-6px_rgba(147,51,234,0.6)] border-b-purple-500",
  },
  {
    id: "pixylabs",
    name: "PixyLabs",
    tag: "High Payout 💎",
    tagColor: "bg-emerald-600",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    isActive: true,
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    glowColor: "shadow-[0_8px_20px_-6px_rgba(16,185,129,0.6)] border-b-emerald-500",
  },
  {
    id: "mylead",
    name: "MyLead",
    tag: "Exclusive 🎯",
    tagColor: "bg-blue-600",
    logoUrl: "https://mylead.global/favicon.ico",
    isActive: true,
    url: (uid: string) => `https://mylead.global/sl/YOUR_LINK?ml_sub1=${uid}`,
    glowColor: "shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] border-b-blue-500",
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls] = useState<Offerwall[]>(defaultOfferwalls);

  return (
    <div className="p-4 md:p-8 min-h-screen space-y-10">
      
      {/* 1. Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1a1a1a] to-black border border-white/5 p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1">
            Welcome back, {userData?.name || 'Challenger'}!
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
            Turn Your Time Into <span className="brand-gradient bg-clip-text text-transparent underline decoration-blue-500/30">Real Cash</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Complete simple tasks, play games, and share your opinion to start stacking points today.
          </p>
        </div>
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* 2. Trust Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <ShieldCheck className="text-emerald-400" />, title: "Secure Payouts", desc: "100% Verified Providers" },
          { icon: <Clock className="text-amber-400" />, title: "Instant Credits", desc: "Points added in minutes" },
          { icon: <Zap className="text-purple-400" />, title: "Boosted Offers", desc: "Extra 10% for level 2+" },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="p-3 rounded-xl bg-white/[0.03]">{item.icon}</div>
            <div>
              <p className="text-white font-bold text-sm">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Offerwalls Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-8 rounded-full bg-blue-500" />
            <h2 className="text-2xl font-bold text-white">Best Offerwalls</h2>
          </div>
          <span className="text-gray-500 text-sm">{offerwalls.length} active walls</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {offerwalls.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              className={`relative bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.05] active:scale-95 border-b-[3px] ${wall.glowColor}`}
            >
              <div className="absolute top-3 right-3">
                <Badge className={`${wall.tagColor} text-[9px] font-black px-2 py-0.5 rounded-lg border-none text-white uppercase`}>
                  {wall.tag}
                </Badge>
              </div>

              <div className="h-16 flex items-center justify-start mb-6">
                <img 
                  src={wall.logoUrl} 
                  alt={wall.name} 
                  className="max-h-full max-w-[80%] object-contain filter grayscale-[0.3] hover:grayscale-0 transition-all"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-white font-black text-sm tracking-wide uppercase">{wall.name}</h3>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < 4 ? "fill-yellow-500 text-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                  ))}
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-blue-400/80">
                <MousePointer2 className="h-3 w-3" />
                CLICK TO START
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
