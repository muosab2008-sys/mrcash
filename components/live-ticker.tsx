"use client";

import { useEffect, useState } from "react";
import { db, collection, query, orderBy, limit, onSnapshot } from "@/lib/firebase";
import { Zap } from "lucide-react";

interface FeedItem {
  id: string;
  username: string;
  points: number;
  company: string;
  timestamp: string;
}

export function LiveTicker() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    { id: "1", username: "Ahmed", points: 50, company: "Adlexy", timestamp: "" },
    { id: "2", username: "Sara", points: 120, company: "TaskWall", timestamp: "" },
    { id: "3", username: "Omar", points: 75, company: "Gemiad", timestamp: "" },
    { id: "4", username: "Layla", points: 200, company: "Offery", timestamp: "" },
    { id: "5", username: "Hassan", points: 90, company: "BagiraWall", timestamp: "" },
  ]);

  useEffect(() => {
    try {
      const feedRef = collection(db, "live_feed");
      const q = query(feedRef, orderBy("timestamp", "desc"), limit(10));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as FeedItem[];
          setFeedItems(items);
        }
      });
      return () => unsubscribe();
    } catch {
      // Firestore collection may not exist yet, use defaults
    }
  }, []);

  return (
    <div className="bg-secondary/50 border-b border-border overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-primary/10 px-3 py-1.5 flex items-center gap-1.5 border-r border-border z-10">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary whitespace-nowrap">LIVE</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="animate-ticker flex items-center gap-8 whitespace-nowrap py-1.5">
            {feedItems.map((item) => (
              <span key={item.id} className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">{item.username}</span>
                {" earned "}
                <span className="text-primary font-semibold">{item.points} pts</span>
                {" from "}
                <span className="text-accent font-medium">{item.company}</span>
              </span>
            ))}
            {feedItems.map((item) => (
              <span key={`dup-${item.id}`} className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">{item.username}</span>
                {" earned "}
                <span className="text-primary font-semibold">{item.points} pts</span>
                {" from "}
                <span className="text-accent font-medium">{item.company}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
