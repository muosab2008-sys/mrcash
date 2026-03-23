"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Star } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  avgPoints: number;
  pointsPerFragment: number;
  isActive: boolean;
  url: any;
  color: string;
}

const defaultOfferwalls: Offerwall[] = [
  {
    id: "playtimeads",
    name: "Playtime Ads",
    description: "Play games and earn points per minute!",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    avgPoints: 2000,
    pointsPerFragment: 50,
    isActive: true,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    color: "#7c3aed", // البنفسجي للتوهج
  },
  {
    id: "pixylabs",
    name: "PixyLabs",
    description: "Complete premium surveys and exclusive tasks",
    logoUrl: "https://offerwall.pixylabs.co/favicon.ico",
    avgPoints: 1200,
    pointsPerFragment: 25,
    isActive: true,
    url: (uid: string) => `https://offerwall.pixylabs.co/230?uid=${uid}`,
    color: "#2563eb",
  },
  {
    id: "bagirawall",
    name: "Bagira Wall",
    description: "Install apps and get instant rewards",
    logoUrl: "https://bagirawall.com/favicon.ico",
    avgPoints: 950,
    pointsPerFragment: 15,
    isActive: true,
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    color: "#16a34a",
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(false);

  const sortedOfferwalls = [...offerwalls].sort((a, b) => b.avgPoints - a.avgPoints);

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      {/* Page Title (Top Stats are Removed) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Offerwalls</h1>
          <p className="text-muted-foreground mt-2 text-lg">Choose a provider and start earning.</p>
        </div>
        <Badge className="bg-[#6A3AB1] text-white rounded-full px-4 py-1.5 font-bold">
          {sortedOfferwalls.length} Providers Live
        </Badge>
      </div>

      {/* Offerwalls Grid with the NEW Side-by-Side Design */}
      <div className="grid gap-6 md:grid-cols-2">
        {sortedOfferwalls.map((wall) => (
          <Card 
            key={wall.id} 
            className="border-border bg-card/50 backdrop-blur-md border-white/5 transition-all hover:border-[var(--brand-cyan)]/50 hover:shadow-2xl hover:translate-y-[-5px] group overflow-hidden"
          >
            <CardHeader className="pb-4 relative">
              {/* تفعيل التوهج الخلفي عند الحوم (Hover Glow) */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
              
              <div className="flex gap-5 relative items-center">
                {/* 1. المربع الصغير المتوهج (أيقونة P) */}
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#2A1B4A] border-2 border-purple-900 shadow-xl shadow-purple-500/50 p-2 flex items-center justify-center transition-transform group-hover:scale-105">
                  <img 
                    src={wall.logoUrl} 
                    alt={wall.name} 
                    className="h-full w-full object-contain"
                  />
                </div>
                
                {/* 2. النصوص على الجانب (بجانب المربع) */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-white font-extrabold">{wall.name}</CardTitle>
                    <Badge variant="secondary" className="bg-[#6A3AB1] text-white border-none font-bold rounded-full">
                      HOT
                    </Badge>
                  </div>
                  
                  {/* النجوم الذهبية */}
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400" />
                    ))}
                  </div>
                  
                  {/* الوصف القصير */}
                  <CardDescription className="text-sm text-gray-400 line-clamp-2">{wall.description}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2 flex items-center justify-between gap-4 border-t border-white/5 bg-black/20 mt-2 p-5 rounded-b-xl">
              {/* تفاصيل النقاط */}
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-400">
                <Zap className="h-5 w-5 text-emerald-400" />
                <span>Up to {wall.avgPoints.toLocaleString()} Points</span>
              </div>
              
              {/* زر التشغيل */}
              <Button
                className="brand-gradient text-white font-bold h-11 px-8 rounded-full shadow-lg shadow-blue-500/20"
                onClick={() => {
                  const finalUrl = typeof wall.url === 'function' 
                    ? wall.url(userData?.email || "guest") 
                    : wall.url;
                  window.open(finalUrl, "_blank");
                }}
              >
                Start Earning
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
