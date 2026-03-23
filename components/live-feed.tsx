"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins } from "lucide-react";
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
      limit(20)
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
    <div className="w-full overflow-hidden bg-[#1a1a1a] border-b border-border">
      <div className="flex animate-scroll">
        {/* Duplicate items for seamless loop */}
        {[...feedItems, ...feedItems].map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex items-center gap-2 px-4 py-2 min-w-fit"
          >
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={item.photoURL || ""} alt={item.username} />
              <AvatarFallback className="bg-muted text-xs">
                {item.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                  {item.username}
                </span>
                <Coins className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-500">
                  {item.points.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {item.source}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
