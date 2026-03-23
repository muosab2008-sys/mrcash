"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, Trophy, Briefcase, Zap, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null); // بيانات المستخدم الكاملة
  const [lastAction, setLastAction] = useState<any>(null); // العرض الأخير الذي ضغطت عليه
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // دالة لجلب بيانات البروفايل الحقيقي من الفايربيز
  const handleUserClick = async (item: any) => {
    setLoading(true);
    setLastAction(item);
    setIsOpen(true);

    try {
      // نفترض أن id المستخدم مخزن في live_feed أو نستخدم اليوزر نيم للبحث
      const userRef = doc(db, "users", item.userId || item.username); 
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setSelectedUser(userSnap.data());
      } else {
        // إذا لم يجد اليوزر بالـ ID، نستخدم البيانات الموجودة في العرض مؤقتاً
        setSelectedUser({
          username: item.username,
          points: item.points,
          totalEarned: item.points,
          level: 1,
          offersCompleted: 1
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
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
              className="flex items-center gap-3 px-8 min-w-fit border-r border-primary/10 cursor-pointer hover:bg-primary/5 transition-colors"
            >
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage src={item.photoURL} />
                <AvatarFallback>{item.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{item.username}</span>
                <span className="text-[10px] text-yellow-500 font-bold">+{item.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#0b0b0b] border-white/5 text-white max-w-md rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          {/* Header Background */}
          <div className="h-28 bg-gradient-to-b from-primary/30 to-transparent relative" />
          
          <div className="px-8 pb-10 -mt-14 flex flex-col items-center">
            {/* User Avatar & Level Badge */}
            <div className="relative">
              <Avatar className="h-28 w-28 border-[6px] border-[#0b0b0b] shadow-2xl">
                <AvatarImage src={lastAction?.photoURL} />
                <AvatarFallback className="text-3xl bg-[#151515]">{selectedUser?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full border-4 border-[#0b0b0b] flex items-center gap-1">
                <Star className="h-3 w-3 fill-white" />
                <span className="text-[10px] font-black italic">LVL {selectedUser?.level || 1}</span>
              </div>
            </div>

            <h2 className="mt-6 text-2xl font-black tracking-tight">{selectedUser?.username}</h2>
            <p className="text-muted-foreground text-xs font-medium">Member since 2024</p>

            {/* Statistics Grid - البيانات الحقيقية */}
            <div className="grid grid-cols-3 gap-2 w-full mt-10 bg-white/5 rounded-3xl p-6 border border-white/5">
              <div className="flex flex-col items-center">
                <Briefcase className="h-5 w-5 text-primary/60 mb-2" />
                <span className="text-lg font-black">{selectedUser?.offersCompleted || 1}</span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Offers</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/10 px-2">
                <Coins className="h-5 w-5 text-yellow-500 mb-2" />
                <span className="text-lg font-black text-yellow-500">
                  {selectedUser?.totalEarned?.toLocaleString() || selectedUser?.points?.toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Total Pts</span>
              </div>
              <div className="flex flex-col items-center">
                <Zap className="h-5 w-5 text-cyan-500 mb-2" />
                <span className="text-lg font-black">{selectedUser?.referralsCount || 0}</span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Refers</span>
              </div>
            </div>

            {/* Activity Card */}
            <div className="w-full mt-8">
               <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Activity</span>
                  <span className="text-[9px] text-primary font-bold">LIVE NOW</span>
               </div>
               <div className="bg-gradient-to-r from-white/5 to-transparent p-4 rounded-2xl flex items-center justify-between border-l-4 border-primary">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-bold">{lastAction?.offerName || "Task Completed"}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">{lastAction?.source}</p>
                    </div>
                  </div>
                  <div className="text-xs font-black text-yellow-500">+{lastAction?.points}</div>
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
          animation: scroll-fast 20s linear infinite;
        }
      `}</style>
    </>
  );
}
