"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, X, Trophy, Briefcase, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null); // لتخزين البيانات التي سيتم عرضها في النافذة
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const openModal = (item: any) => {
    setSelectedItem(item);
    setIsOpen(true);
  };

  if (feedItems.length === 0) return null;

  return (
    <>
      {/* الشريط المتحرك */}
      <div className="w-full overflow-hidden bg-background/95 border-b-2 border-primary/20 py-2">
        <div className="flex animate-scroll-fast items-center">
          {[...feedItems, ...feedItems].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => openModal(item)}
              className="flex items-center gap-3 px-8 min-w-fit border-r border-primary/10 cursor-pointer hover:bg-primary/5 transition-colors"
            >
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage src={item.photoURL || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                  {item.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{item.username}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold">
                  <span className="text-primary">{item.source}</span>
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span className="text-yellow-500">{item.points}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* النافذة الاحترافية (Modal) - تصميم يشبه الصورة التي أرفقتها */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#0f0f0f] border-primary/20 text-white max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl">
          {/* خلفية علوية ملونة */}
          <div className="h-24 bg-gradient-to-r from-primary/20 to-purple-600/20 relative" />
          
          <div className="px-6 pb-8 -mt-12 flex flex-col items-center">
            {/* صورة المستخدم الكبيرة */}
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-[#0f0f0f] shadow-xl">
                <AvatarImage src={selectedItem?.photoURL} />
                <AvatarFallback className="text-2xl bg-[#1a1a1a]">
                  {selectedItem?.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-[#0f0f0f]" />
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight">{selectedItem?.username}</h2>
            <p className="text-muted-foreground text-sm">Active Member</p>

            {/* شبكة الإحصائيات (مثل الصورة) */}
            <div className="grid grid-cols-3 gap-4 w-full mt-8 border-y border-white/5 py-6">
              <div className="flex flex-col items-center">
                <Briefcase className="h-5 w-5 text-primary mb-2" />
                <span className="text-lg font-bold">1</span>
                <span className="text-[10px] text-muted-foreground uppercase">Offers</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/5">
                <Coins className="h-5 w-5 text-yellow-500 mb-2" />
                <span className="text-lg font-bold text-yellow-500">{selectedItem?.points}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Earnings</span>
              </div>
              <div className="flex flex-col items-center">
                <Zap className="h-5 w-5 text-cyan-500 mb-2" />
                <span className="text-lg font-bold">0</span>
                <span className="text-[10px] text-muted-foreground uppercase">Referred</span>
              </div>
            </div>

            {/* تفاصيل العرض الأخيرة (Activity) */}
            <div className="w-full mt-6">
              <h3 className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-[0.2em]">Latest Activity</h3>
              <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{selectedItem?.offerName || "Standard Offer"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{selectedItem?.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                   <Coins className="h-3 w-3" />
                   {selectedItem?.points}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes scroll-fast {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-fast {
          animation: scroll-fast 18s linear infinite;
        }
      `}</style>
    </>
  );
}
