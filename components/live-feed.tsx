"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, Zap, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedItem {
  id: string;
  username: string;
  points: number;
  source: string;
  offerName: string; // اسم العرض
  photoURL?: string;
  userId?: string;
  createdAt: any;
}

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedItem[]);
    });
    return () => unsubscribe();
  }, []);

  if (feedItems.length === 0) return null;

  return (
    <div className="w-full flex justify-center py-4 bg-transparent">
      {/* الكبسولة الرئيسية */}
      <div className="relative flex items-center h-12 w-[95%] max-w-[1400px] bg-[#0d0d0d]/80 backdrop-blur-md rounded-full overflow-hidden border border-white/5 shadow-2xl group">
        
        {/* شارة LIVE الثابتة بألوان الشعار */}
        <div className="absolute left-0 z-30 bg-[#0d0d0d] px-5 h-full flex items-center border-r border-white/5 rounded-l-full">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Live Feed
            </span>
          </div>
        </div>

        {/* الشريط المتحرك - يتوقف عند Hover */}
        <div className="flex whitespace-nowrap items-center animate-scroll group-hover:[animation-play-state:paused] ml-28">
          {[...feedItems, ...feedItems].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="relative inline-flex items-center gap-3 px-6 border-r border-white/5 last:border-none group/item"
            >
              <Avatar className="h-7 w-7 border border-white/10 shadow-sm">
                <AvatarImage src={item.photoURL} />
                <AvatarFallback className="bg-white/5 text-[10px] uppercase">{item.username?.[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-white/90">{item.username}</span>
                
                {/* النقاط بألوان الشعار */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  <Coins className="h-3 w-3 text-cyan-400" />
                  <span className="font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {(item.points || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* القائمة الصغيرة (Tooltip) التي تظهر عند Hover على المستخدم */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[#121212] border border-white/10 rounded-xl p-3 shadow-2xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 z-50">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <div className="p-1 bg-cyan-500/20 rounded">
                      <Zap size={12} className="text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Offer Details</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-white truncate">
                      {item.offerName || "Task Completed"}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase">
                      Wall: <span className="text-purple-400">{item.source}</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase">
                      Reward: <span className="text-green-400">{item.points} Pts</span>
                    </p>
                  </div>
                </div>
                {/* سهم صغير للقائمة */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121212] border-t border-l border-white/10 rotate-45"></div>
              </div>
            </div>
          ))}
        </div>

        {/* تلاشي جهة اليمين */}
        <div className="absolute right-0 top-0 bottom-0 w-20 z-20 bg-gradient-to-l from-[#0d0d0d] to-transparent pointer-events-none rounded-r-full" />
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 35s linear infinite;
        }
      `}</style>
    </div>
  );
}
