"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, Trophy, Briefcase, Zap, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [lastAction, setLastAction] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleUserClick = async (item: any) => {
    setLastAction(item);
    setIsOpen(true);
    setSelectedUser(null);

    try {
      if (item.userId) {
        const userRef = doc(db, "users", item.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setSelectedUser(userSnap.data());
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  if (feedItems.length === 0) return null;

  return (
    <>
      <div className="w-full overflow-hidden bg-background/95 border-b-2 border-primary/20 py-2">
        <div className="flex animate-scroll-fast items-center">
          {[...feedItems, ...feedItems].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => handleUserClick(item)}
              className="flex items-center gap-3 px-8 min-w-fit border-r border-primary/10 cursor-pointer hover:bg-primary/5 transition-all"
            >
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage src={item.photoURL} />
                <AvatarFallback>{item.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{item.username}</span>
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  {/* حل المشكلة: إضافة حماية للقيمة */}
                  <span className="text-[11px] font-black text-yellow-500">
                    +{(item.points || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="h-32 bg-gradient-to-br from-primary/40 to-transparent relative" />
          
          <div className="px-8 pb-10 -mt-16 flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-32 w-32 border-[6px] border-[#0a0a0a] shadow-2xl">
                <AvatarImage src={selectedUser?.photoURL || lastAction?.photoURL} />
                <AvatarFallback className="text-4xl bg-[#151515] font-black">
                  {lastAction?.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-5 py-1 rounded-full border-4 border-[#0a0a0a] flex items-center gap-1.5 shadow-lg">
                <Star className="h-3 w-3 fill-white" />
                <span className="text-[11px] font-black">LEVEL {selectedUser?.level || 1}</span>
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-black">{selectedUser?.username || lastAction?.username}</h2>

            <div className="grid grid-cols-3 gap-3 w-full mt-10 bg-white/5 rounded-[2rem] p-6 border border-white/5">
              <div className="flex flex-col items-center">
                <Briefcase size={20} className="text-primary mb-2" />
                <span className="text-lg font-black">{selectedUser?.offersCompleted || 1}</span>
                <span className="text-[9px] text-muted-foreground font-black uppercase">Offers</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/10 px-2">
                <Coins size={20} className="text-yellow-500 mb-2" />
                <span className="text-lg font-black text-yellow-500">
                  {/* حل المشكلة في المودال أيضاً */}
                  {(selectedUser?.totalEarned || lastAction?.points || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground font-black uppercase">Total Pts</span>
              </div>
              <div className="flex flex-col items-center">
                <Zap size={20} className="text-cyan-500 mb-2" />
                <span className="text-lg font-black">{selectedUser?.referralsCount || 0}</span>
                <span className="text-[9px] text-muted-foreground font-black uppercase">Refers</span>
              </div>
            </div>

            <div className="w-full mt-8">
               <div className="bg-white/5 p-5 rounded-[1.5rem] flex items-center justify-between border-l-4 border-primary">
                  <div className="flex items-center gap-4">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-black">{lastAction?.offerName || "Offer Completed"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">via {lastAction?.source}</p>
                    </div>
                  </div>
                  <div className="text-sm font-black text-yellow-500">
                    +{(lastAction?.points || 0).toLocaleString()}
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
          animation: scroll-fast 25s linear infinite;
        }
      `}</style>
    </>
  );
}
