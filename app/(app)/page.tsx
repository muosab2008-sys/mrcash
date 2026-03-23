"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Flame, LayoutGrid, Zap, ExternalLink } from "lucide-react";

interface Offerwall {
  id: string;
  name: string;
  tag: string;
  logoUrl: string;
  url: any;
  // توهج خلفية البطاقة
  cardGlow: string; 
  // لون الحدود السفلية المتوهجة
  bottomGlow: string;
  // لون الإضاءة خلف الأيقونة
  iconBeam: string;
  category: "featured" | "standard";
}

const defaultOfferwalls: Offerwall[] = [
  // --- Featured Partners (طبق الأصل) ---
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Trendify 🔥",
    logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    cardGlow: "shadow-[0_0_30px_rgba(147,51,234,0.15)]",
    bottomGlow: "border-b-purple-500",
    iconBeam: "from-purple-600/30 to-transparent",
    category: "featured"
  },
  // --- Offer Partners (مثال إضافي) ---
  {
    id: "dtowall",
    name: "adtowall",
    tag: "TrueLeads 🎯",
    logoUrl: "https://bagirawall.com/favicon.ico",
    url: (uid: string) => `#`,
    cardGlow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    bottomGlow: "border-b-cyan-500",
    iconBeam: "from-cyan-600/30 to-transparent",
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
      <div className="space-y-8">
        {/* العناوين بالأزرق السماوي الخاص بالشعار */}
        <div className="flex items-center gap-3 border-l-4 border-[var(--brand-cyan)] pl-4">
          {icon}
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {title}
          </h2>
        </div>
        
        {/* Grid Layout - البطاقات العمودية العميقة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {filtered.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => {
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
              }}
              // تصميم البطاقة العمودية العميقة (طبق الأصل)
              className={`relative group bg-[#050505] border-2 border-white/5 rounded-[35px] p-6 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 border-b-[3px] ${wall.bottomGlow} ${wall.cardGlow} overflow-hidden flex flex-col items-center`}
            >
              {/* التوهج الخلفي (طبق الأصل من الصورة P) */}
              <div className="absolute top-10 w-32 h-32 bg-purple-600/10 blur-[50px] rounded-full group-hover:bg-purple-600/20 transition-all z-0"></div>

              {/* تأثير "شعاع الضوء" خلف الأيقونة */}
              <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-radial ${wall.iconBeam} rounded-full blur-2xl z-0`}></div>
              
              {/* Badge العلوي */}
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-[#6A3AB1] text-white text-[10px] px-3 py-1.5 rounded-full border-none font-bold uppercase tracking-widest">
                  {wall.tag}
                </Badge>
              </div>

              {/* الأيقونة الدائرية الضخمة (طبق الأصل من P) */}
              <div className="relative z-10 h-32 w-32 rounded-full border-[6px] border-[#1a102d] bg-[#0a0a0a] p-1 shadow-2xl transition-transform group-hover:scale-105">
                <img 
                src={wall.logoUrl} 
                alt={wall.name} 
                className="h-full w-full object-contain rounded-full" 
                />
              </div>

              {/* المعلومات باللون الأبيض العريض والكبير (طبق الأصل) */}
              <div className="mt-8 space-y-3 z-10 w-full text-center">
                <h3 className="text-3xl text-white font-black uppercase tracking-tight italic">
                  {wall.name}
                </h3>
                
                {/* النجوم الذهبية */}
                <div className="flex gap-1 text-yellow-500 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4.5 w-4.5 ${i < 4 ? "fill-yellow-500" : "fill-zinc-800 text-zinc-800"}`} />
                  ))}
                </div>

                {/* Zap Points */}
                <div className="flex items-center justify-center gap-2.5 text-emerald-400 font-bold text-sm mt-3 bg-white/5 py-1.5 rounded-lg border border-white/5">
                  <Zap className="h-4 w-4" />
                  <span>Up to 2,000 Points</span>
                </div>
              </div>

              {/* زر التشغيل في الأسفل */}
              <Button
                className="mt-10 w-full brand-gradient text-white font-black h-12 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 z-10"
                onClick={(e) => {
                  e.stopPropagation(); // لمنع تشغيل حدث الـ Card onClick
                  const finalUrl = typeof wall.url === 'function' ? wall.url(userData?.email || "guest") : wall.url;
                  window.open(finalUrl, "_blank");
                }}
              >
                Start Earning
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-20 bg-black text-white">
      
      {/* القسم الأول: الشركات المميزة */}
      {renderSection("Featured Partners", <Flame className="text-[var(--brand-cyan)] h-7 w-7" />, "featured")}

      {/* القسم الثاني: شركات العروض */}
      {renderSection("Offer Partners", <LayoutGrid className="text-[var(--brand-cyan)] h-7 w-7" />, "standard")}

    </div>
  );
}
