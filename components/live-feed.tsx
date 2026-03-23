"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, Zap, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedItem {
  id: string;
  username: string;
  points: number;
  source: string;
  offerName: string;
  photoURL?: string;
  createdAt: any;
}

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(15));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedItem[]);
    });
  }, []);

  // دالة التعامل مع النقرة للجوال
  const handleTouch = (id: string) => {
    if (activeTooltip === id) setActiveTooltip(null);
    else setActiveTooltip(id);
  };

  if (feedItems.length === 0) return null;

  return (
    <div className="w-full flex justify-center py-4 bg-transparent select-none">
      <div className="relative flex items-center h-12 w-[95%] max-w-[1400px] bg-[#0d0d0d]/80 backdrop-blur-md rounded-full overflow-hidden border border-white/5 shadow-2xl group">
        
        {/* شارة LIVE */}
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

        {/* الحاوية المتحركة */}
        <div className="flex whitespace-nowrap items-center animate-scroll group-hover:[animation-play-state:paused] ml-28">
          {[...feedItems, ...feedItems].map((item, index) => {
            const itemId = `${item.id}-${index}`;
            return (
              <div
                key={itemId}
                className="relative inline-flex items-center gap-3 px-6 border-r border-white/5 last:border-none group/item cursor-pointer"
                onMouseEnter={() => setActiveTooltip(itemId)}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => handleTouch(itemId)}
              >
                <Avatar className="h-7 w-7 border border-white/10">
                  <AvatarImage src={item.photoURL} />
                  <AvatarFallback className="bg-white/5 text-[10px] uppercase">{item.username?.[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white/90">{item.username}</span>
                  <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    <span className="font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      {(item.points || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* المربع الصغير (Tooltip) - يطابق الصورة التي أرسلتها */}
                <div className={`
                  absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 
                  bg-[#0f0f0f] border border-white/10 rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                  transition-all duration-300 z-[100]
                  ${activeTooltip === itemId ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}
                `}>
                  <div className="space-y-2">
                    <div className="flex flex-col border-b border-white/5 pb-2">
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">User Name</span>
                      <span className="text-xs font-black text-white">{item.username}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Offer Name</span>
                      <span className="text-[11px] font-bold text-cyan-400 truncate leading-tight">
                        {item.offerName || "Standard Task"}
                      </span>
                    </div>

                    <div className="flex justify-between items-end pt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">Offerwall</span>
                        <span className="text-[10px] font-bold text-purple-400">{item.source}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest block">Reward</span>
                        <span className="text-xs font-black text-yellow-500">{item.points} Pts</span>
                      </div>
                    </div>
                  </div>
                  {/* سهم المربع */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f0f0f] border-b border-r border-white/10 rotate-45 -translate-y-[6px]"></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-20 z-20 bg-gradient-to-l from-[#0d0d0d] to-transparent pointer-events-none rounded-r-full" />
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
