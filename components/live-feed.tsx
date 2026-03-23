"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedItem {
  id: string;
  username: string;
  points: number;
  source: string;
  photoURL?: string;
  createdAt: Date;
}

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "live_feed"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as FeedItem[];
      setFeedItems(items);
    });

    return () => unsubscribe();
  }, []);

  if (feedItems.length === 0) return null;

  return (
    <div className="relative w-full bg-background/60 backdrop-blur-md border-y border-border/50 h-12 flex items-center overflow-hidden group">
      {/* مؤشر LIVE الثابت على اليسار لإعطاء لمسة احترافية */}
      <div className="absolute left-0 z-20 bg-background/80 px-4 h-full flex items-center border-r border-border/40 shadow-[10px_0_15px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live</span>
        </div>
      </div>

      {/* الحاوية المتحركة - تم حل مشكلة الـ Glitch هنا */}
      <div className="flex whitespace-nowrap items-center hover:[animation-play-state:paused] animate-scroll ml-16">
        {/* نكرر المصفوفة 3 مرات لضمان عدم وجود فراغات أو قفزات (Seamless Loop) */}
        {[...feedItems, ...feedItems, ...feedItems].map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="inline-flex items-center gap-3 px-8 border-r border-border/20 last:border-none"
          >
            <Avatar className="h-6 w-6 ring-1 ring-primary/20 ring-offset-1 ring-offset-background">
              <AvatarImage src={item.photoURL || ""} alt={item.username} />
              <AvatarFallback className="text-[9px] bg-primary/5">{item.username?.[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground/90">{item.username}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">earned</span>
              
              <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                <Coins className="h-3 w-3 text-yellow-500 fill-yellow-500/20" />
                <span className="text-xs font-black text-primary">
                  {item.points.toLocaleString()}
                </span>
              </div>

              <span className="text-[10px] text-muted-foreground/60 italic">
                via {item.source}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* تأثير التلاشي على اليمين ليكون الانتقال ناعم */}
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}
