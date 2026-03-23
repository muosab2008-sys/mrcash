"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Gamepad2, Star } from "lucide-react";

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
    description: "Play games and earn points for every minute you play!",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    avgPoints: 2000,
    pointsPerFragment: 50,
    isActive: true,
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    color: "#facc15",
  },
  {
    id: "pixylabs",
    name: "PixyLabs",
    description: "High-paying surveys and exclusive mobile offers",
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
    description: "Install apps and complete quick tasks for rewards",
    logoUrl: "https://bagirawall.com/favicon.ico",
    avgPoints: 950,
    pointsPerFragment: 15,
    isActive: true,
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    color: "#16a34a",
  },
  {
    id: "mylead",
    name: "MyLead",
    description: "Unlock exclusive global tasks and rewards",
    logoUrl: "https://mylead.global/favicon.ico",
    avgPoints: 1100,
    pointsPerFragment: 20,
    isActive: true,
    url: (uid: string) => `https://mylead.global/sl/YOUR_LINK?ml_sub1=${uid}`,
    color: "#7c3aed",
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(false);

  const sortedOfferwalls = [...offerwalls].sort((a, b) => b.avgPoints - a.avgPoints);

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Offerwalls</h1>
        <p className="text-muted-foreground mt-2 text-lg">Complete tasks from our partners to earn points instantly.</p>
      </div>

      {/* Offerwalls Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sortedOfferwalls.map((wall) => (
          <Card 
            key={wall.id} 
            className="border-border bg-card/40 backdrop-blur-md border-white/5 transition-all hover:border-[var(--brand-cyan)]/50 hover:shadow-2xl hover:translate-y-[-5px]"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white p-2 shadow-inner">
                  <img 
                    src={wall.logoUrl} 
                    alt={wall.name} 
                    className="h-full w-full object-contain"
                  />
                </div>
                <Badge variant="secondary" className="bg-[var(--brand-cyan)]/20 text-[var(--brand-cyan)] border-none font-bold">
                  HOT
                </Badge>
              </div>
              <CardTitle className="text-xl mt-4 text-white font-bold">{wall.name}</CardTitle>
              <CardDescription className="text-sm text-gray-400 line-clamp-2">{wall.description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-emerald-400">
                <Star className="h-4 w-4 fill-emerald-400" />
                <span>Up to {wall.avgPoints.toLocaleString()} Points</span>
              </div>
              
              <Button
                className="w-full brand-gradient text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/20"
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

      {/* Featured Banner for Playtime */}
      <div className="mt-10 rounded-3xl p-8 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
            <div className="bg-yellow-400 p-4 rounded-2xl animate-bounce">
                <Gamepad2 className="h-8 w-8 text-black" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Play & Earn</h2>
                <p className="text-gray-300">Get paid for every minute you play games on your phone.</p>
            </div>
        </div>
        <Button 
            className="bg-white text-black hover:bg-gray-200 font-bold px-10 h-12 rounded-full"
            onClick={() => window.open(`https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${userData?.email || 'guest'}`, "_blank")}
        >
            Launch Games
        </Button>
      </div>
    </div>
  );
}
