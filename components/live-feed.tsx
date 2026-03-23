"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "live_feed"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setFeedItems(items);
    });

    return () => unsubscribe();
  }, []);

  if (feedItems.length === 0) return null;

  return (
    // التعديل هنا: جعلنا الخلفية شفافة (bg-background/80) وألغينا الـ absolute عشان يثبت مكانه تحت
    <div className="w-full overflow-hidden bg-background/80 backdrop-blur-md border-b border-border py-1">
      <div className="flex animate-scroll items-center">
        {/* نكرر مرتين فقط كما كان في كودك الأصلي عشان السرعة ترجع طبيعية */}
        {[...feedItems, ...feedItems].map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex items-center gap-3 px-6 min-w-fit border-r border-border/50"
          >
            <Avatar className="h-7 w-7 border border-border">
              <AvatarImage src={item.photoURL || ""} alt={item.username} />
              <AvatarFallback className="bg-muted text-[10px]">
                {item.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  {item.username}
                </span>
                <Coins className="h-3 w-3 text-yellow-500" />
                <span className="text-xs font-black text-yellow-500">
                  {item.points.toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground italic">
                from {item.source}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
