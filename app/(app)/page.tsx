"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, Coins } from "lucide-react";

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

// قائمة الشركات المحدثة والمنظمة
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
  },
  {
    id: "mylead",
    name: "MyLead",
    description: "Exclusive global offers and smartlinks",
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

  // ترتيب العروض حسب النقاط الأفضل
  const sortedOfferwalls = [...offerwalls].sort((a, b) => b.avgPoints - a.avgPoints);

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      {/* عنوان الصفحة فقط (بعد حذف الإحصائيات العلوية) */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Offerwalls</h1>
        <p className="text-muted-foreground mt-2 text-lg">Complete tasks to earn points instantly.</p>
      </div>

      {/* شبكة العروض (Offers Grid) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sortedOfferwalls.map((wall) => (
          <Card 
            key={wall.id} 
            className="border-border bg-card/40 backdrop-blur-md border-white/5 transition-all hover:border-[var(--brand-cyan)]/50 hover:shadow-2xl hover:translate-y-[-5px]"
          >
            <CardHeader className="pb-3 relative">
              <div className="flex items-start justify-between relative">
                {/* تعديل الأيقونة: المربع الآن بخلفية سوداء */}
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-black border-2 border-white/10 p-2 flex items-center justify-center">
                  <img 
                    src={wall.logoUrl} 
                    alt={wall.name} 
                    className="h-full w-full object-contain"
                  />
                </div>
                
                <Badge variant="secondary" className="bg-[#6A3AB1] text-white border-none font-bold rounded-full py-1.5 px-4">
                  HOT
                </Badge>
              </div>
              
              <div className="mt-5 space-y-1">
                <CardTitle className="text-xl text-white font-extrabold">{wall.name}</CardTitle>
              </div>
              
              <CardDescription className="text-sm text-gray-400 mt-2 line-clamp-2">{wall.description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-2">
              {/* تفاصيل العرض */}
              <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-emerald-400">
                <Coins className="h-4 w-4 text-emerald-400" />
                <span>Up to {wall.avgPoints.toLocaleString()} Points</span>
              </div>
              
              {/* زر التشغيل */}
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
    </div>
  );
}
