"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Star, Flame, X, Loader2, ExternalLink, LayoutGrid } from "lucide-react";

// بيانات الشركات مع ألوان التوهج الخاصة بكل واحدة
const offerwalls = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Hot 🔥",
    logo: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    glowColor: "rgba(147, 51, 234, 0.6)", // توهج بنفسجي لـ PlayTime
    borderColor: "border-purple-500/50"
  },
  {
    id: "adtowall",
    name: "Adtowall",
    tag: "New",
    logo: "https://bagirawall.com/favicon.ico",
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    glowColor: "rgba(6, 182, 212, 0.6)", // توهج سماوي
    borderColor: "border-cyan-500/50"
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [selectedWall, setSelectedWall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleOpen = (wall: any) => {
    setSelectedWall(wall);
    setLoading(true);
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white space-y-10">
      
      <header className="flex items-center gap-3 border-l-4 border-cyan-400 pl-4">
        <LayoutGrid className="text-cyan-400 w-6 h-6" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Offerwalls</h2>
      </header>

      {/* Grid: المربعات الصغيرة "الكيوت" بزوايا دائرية وتوهج */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {offerwalls.map((wall) => (
          <Card 
            key={wall.id}
            onClick={() => handleOpen(wall)}
            // الزوايا دائرية جداً (rounded-[2.5rem]) والتوهج متغير حسب الشركة
            className={`relative bg-[#0c0c0c] border-2 ${wall.borderColor} rounded-[2rem] p-6 cursor-pointer hover:scale-105 transition-all duration-300 group overflow-hidden`}
            style={{ boxShadow: `0 0 25px -10px ${wall.glowColor}` }}
          >
            {/* Badge */}
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/5 text-white/70 text-[8px] border-none px-2 rounded-full font-bold uppercase">
                {wall.tag}
              </Badge>
            </div>

            {/* Logo & Name */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 p-2 flex items-center justify-center shadow-inner group-hover:rotate-3 transition-transform">
                <img src={wall.logo} alt={wall.name} className="w-full h-full object-contain" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-gray-300">{wall.name}</p>
                <div className="flex justify-center mt-1 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-yellow-500 text-yellow-500" : "text-zinc-800"}`} />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* النافذة المنبثقة (Full Screen Modal) */}
      <Dialog open={!!selectedWall} onOpenChange={() => setSelectedWall(null)}>
        <DialogContent className="max-w-[100vw] w-full h-full md:h-[96vh] md:max-w-[95vw] p-0 bg-black border-white/10 overflow-hidden rounded-none md:rounded-[2rem] flex flex-col">
          
          {/* Header الاحترافي: (شعار + اسم + زر الرابط الخارجي + زر إغلاق) */}
          <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 p-1.5 border border-white/10 shadow-lg">
                <img src={selectedWall?.logo} alt="icon" className="w-full h-full object-contain rounded-full" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tighter">{selectedWall?.name}</p>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest leading-none">Terminal Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* زر المربع الصغير (رابط خارجي) */}
              <button 
                onClick={() => window.open(typeof selectedWall?.url === 'function' ? selectedWall.url(userData?.email || "guest") : selectedWall?.url, "_blank")}
                className="p-2.5 bg-white/5 hover:bg-cyan-500/20 text-white rounded-xl transition-all border border-white/5 group"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5 group-hover:scale-110" />
              </button>
              
              {/* زر الإغلاق (X) */}
              <button 
                onClick={() => setSelectedWall(null)}
                className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white rounded-xl transition-all border border-white/5 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>

          {/* منطقة العرض (Iframe) */}
          <div className="flex-1 relative bg-[#050505]">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Connecting to Partner...</p>
              </div>
            )}
            {selectedWall && (
              <iframe 
                src={typeof selectedWall.url === 'function' ? selectedWall.url(userData?.email || "guest") : selectedWall.url} 
                className="w-full h-full border-none" 
                onLoad={() => setLoading(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
