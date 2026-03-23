"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(15));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  if (feedItems.length === 0) return null;

  return (
    <div className="w-full flex justify-center py-6 bg-transparent select-none">
      {/* الحاوية الخارجية مع مساحة كافية للظهور العلوي */}
      <div className="relative w-[95%] max-w-[1400px] h-12 flex items-center">
        
        {/* الكبسولة الرئيسية - رجعنا overflow-hidden لضبط الشكل */}
        <div className="absolute inset-0 bg-[#0d0d0d]/80 backdrop-blur-md rounded-full border border-white/5 shadow-2xl overflow-hidden flex items-center z-10">
          
          {/* شارة LIVE الثابتة */}
          <div className="absolute left-0 z-30 bg-[#0d0d0d] px-5 h-full flex items-center border-r border-white/5 rounded-l-full">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Live
              </span>
            </div>
          </div>

          {/* الشريط المتحرك */}
          <div className="flex whitespace-nowrap items-center animate-scroll group hover:[animation-play-state:paused] ml-28">
            {[...feedItems, ...feedItems].map((item, index) => {
              const itemId = `${item.id}-${index}`;
              return (
                <div
                  key={itemId}
                  className="relative inline-flex items-center gap-3 px-6 border-r border-white/5 last:border-none cursor-pointer group/item"
                  onMouseEnter={() => setActiveTooltip(itemId)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setActiveTooltip(activeTooltip === itemId ? null : itemId)}
                >
                  <Avatar className="h-7 w-7 border border-white/10 pointer-events-none">
                    <AvatarImage src={item.photoURL} />
                    <AvatarFallback className="bg-white/5 text-[10px]">{item.username?.[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center gap-2 text-xs pointer-events-none">
                    <span className="font-bold text-white/90">{item.username}</span>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      <span className="font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {(item.points || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* المربع الصغير (Tooltip) - تم نقله ليكون مستقلاً عن الـ overflow */}
                  <div className={`
                    absolute bottom-[140%] left-1/2 -translate-x-1/2 w-56 
                    bg-[#0f0f0f] border border-white/10 rounded-xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)]
                    transition-all duration-300 z-[999] pointer-events-none
                    ${activeTooltip === itemId ? "opacity-100 visible translate-y-0 scale-100" : "opacity-0 invisible translate-y-4 scale-95"}
                  `}>
                    <div className="space-y-2">
                      <div className="flex flex-col border-b border-white/5 pb-1.5">
                        <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">User</span>
                        <span className="text-xs font-black text-white">{item.username}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Offer</span>
                        <span className="text-[10px] font-bold text-cyan-400 truncate">{item.offerName || "Standard Task"}</span>
                      </div>
                      <div className="flex justify-between items-end pt-1">
                        <div>
                          <span className="text-[8px] text-white/30 uppercase font-bold block">Wall</span>
                          <span className="text-[9px] font-bold text-purple-400">{item.source}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-yellow-500">+{item.points} Pts</span>
                        </div>
                      </div>
                    </div>
                    {/* سهم المربع الصغير */}
                    <div className="absolute top-[98%] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f0f0f] border-b border-r border-white/10 rotate-45"></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* تلاشي جهة اليمين */}
          <div className="absolute right-0 top-0 bottom-0 w-20 z-20 bg-gradient-to-l from-[#0d0d0d] to-transparent pointer-events-none rounded-r-full" />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
