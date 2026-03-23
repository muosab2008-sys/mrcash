"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  if (feedItems.length === 0) return null;

  // دالة تظهر تفاصيل العرض عند الضغط
  const showDetails = (item: any) => {
    alert(`User: ${item.username}\nOffer: ${item.offerName || 'Task'}\nWall: ${item.source}\nPoints: ${item.points}`);
  };

  return (
    <div className="w-full overflow-hidden bg-background/95 border-b-2 border-primary/20 py-2 cursor-default">
      {/* تم إزالة hover:pause لكي لا يتوقف الشريط أبداً */}
      <div className="flex animate-scroll-fast items-center">
        {[...feedItems, ...feedItems].map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            onClick={() => showDetails(item)}
            className="flex items-center gap-3 px-8 min-w-fit border-r border-primary/10 cursor-pointer hover:bg-primary/5 transition-colors"
          >
            {/* الصورة الشخصية للمستخدم */}
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage src={item.photoURL || ""} alt={item.username} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {item.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* أيقونة صغيرة تدل على أنه "لايف" */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-background"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-foreground tracking-tight">
                  {item.username}
                </span>
                <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded shadow-sm">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-bold text-yellow-500">
                    {item.points.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-medium">
                <span>Completed</span>
                <span className="text-primary font-bold">{item.offerName || "Offer"}</span>
                <span>on</span>
                <span className="underline decoration-primary/30">{item.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* لإضافة السرعة المطلوبة، أضف هذا الجزء في ملف tailwind.config.js أو استخدم ستايل مدمج */}
      <style jsx>{`
        @keyframes scroll-fast {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-fast {
          animation: scroll-fast 18s linear infinite;
        }
      `}</style>
    </div>
  );
}
