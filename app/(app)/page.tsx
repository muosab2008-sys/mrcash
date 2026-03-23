"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Star, Flame, LayoutGrid, X, Loader2, ChevronRight } from "lucide-react";

const offerwalls = [
  {
    id: "playtime",
    name: "PlayTimeAds",
    tag: "Trendify 🔥",
    logo: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",
    url: (uid: string) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
    color: "rgba(147, 51, 234, 0.5)"
  },
  {
    id: "adtowall",
    name: "adtowall",
    tag: "TrueLeads 🎯",
    logo: "https://bagirawall.com/favicon.ico",
    url: (uid: string) => `https://bagirawall.com/wall/YOUR_ID?subId=${uid}`,
    color: "rgba(6, 182, 212, 0.5)"
  }
];

export default function EarnPage() {
  const { userData } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const handleOpen = (urlFn: any) => {
    const finalUrl = typeof urlFn === "function" ? urlFn(userData?.email || "guest") : urlFn;
    setActiveUrl(finalUrl);
    setLoading(true);
    setOpen(true);
  };

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen text-white space-y-12">
      {/* Featured Partners Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Flame className="text-cyan-400 w-6 h-6" />
          <h2 className="text-xl font-bold uppercase tracking-tight">Featured Partners</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {offerwalls.map((wall) => (
            <Card 
              key={wall.id}
              onClick={() => handleOpen(wall.url)}
              className="relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-white/20 transition-all group overflow-hidden"
              style={{ boxShadow: `0 4px 20px -10px ${wall.color}` }}
            >
              {/* Badge */}
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-purple-600/20 text-purple-400 text-[8px] px-2 border-none">
                  {wall.tag}
                </Badge>
              </div>

              {/* Logo */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 p-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src={wall.logo} alt={wall.name} className="w-full h-full object-contain" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-200 truncate">{wall.name}</p>
                  <div className="flex justify-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-yellow-500 text-yellow-500" : "text-gray-700"}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover Effect Line */}
              <div className="absolute bottom-0 left-0 h-[2px] bg-cyan-400 w-0 group-hover:w-full transition-all duration-300" />
            </Card>
          ))}
        </div>
      </section>

      {/* Iframe Modal (The View you wanted) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[100vw] w-full h-full md:h-[95vh] md:max-w-[90vw] p-0 bg-[#0f0f0f] border-white/10 overflow-hidden rounded-none md:rounded-3xl">
          {/* Custom Header for the Iframe */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-sm bg-cyan-400" />
              </div>
              <p className="font-bold text-white uppercase text-sm tracking-widest">Offerwall Terminal</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="relative w-full h-full">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-50">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="mt-4 text-gray-500 font-medium">Securing connection...</p>
              </div>
            )}
            <iframe 
              src={activeUrl} 
              className="w-full h-full border-none" 
              onLoad={() => setLoading(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
