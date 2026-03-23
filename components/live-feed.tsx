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
    // جلب آخر 10 عروض لجعل الشريط خفيفاً
    const q = query(
      collection(db, "live_feed"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as FeedItem[];
        setFeedItems(items);
      },
      (error) => {
        console.error("Live feed error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  if (feedItems.length === 0) return null;

  return (
    // التعديل الأساسي: حاوية خارجية تملأ العرض، بدون absolute، وبخلفية شفافة
    <div className="w-full flex justify-center py-3 bg-background/50 backdrop-blur-sm border-b border-border/40">
      
      {/* تصميم "الكبسولة" الاحترافي كما في الصورة */}
      <div className="relative flex items-center h-10 w-[95%] max-w-[1400px] bg-card/80 rounded-full overflow-hidden border border-border group shadow-inner">
        
        {/* مؤشر LIVE الثابت على اليسار لإعطاء لمسة احترافية */}
        <div className="absolute left-0 z-20 bg-card px-4 h-full flex items-center border-r border-border rounded-l-full shadow-[5px_0_15px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Live</span>
          </div>
        </div>

        {/* الحاوية المتحركة - تم حل مشكلة الـ Glitch والسرعة هنا */}
        <div className="flex whitespace-nowrap items-center hover:[animation-play-state:paused] animate-scroll ml-16">
          {/* نكرر المصفوفة لضمان Seamless Loop */}
          {[...feedItems, ...feedItems].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="inline-flex items-center gap-2.5 px-6 border-r border-border/20 last:border-none"
            >
              <Avatar className="h-6 w-6 border-2 border-primary/20 ring-1 ring-background">
                <AvatarImage src={item.photoURL || ""} alt={item.username} />
                <AvatarFallback className="text-[9px] bg-primary/5">{item.username?.[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-foreground/90">{item.username}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">earned</span>
                
                <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20 shadow-sm">
                  <Coins className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20" />
                  <span className="font-bold text-yellow-500">
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
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-card to-transparent pointer-events-none rounded-r-full" />
      </div>
    </div>
  );
}
