"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Coins, Trophy, Briefcase, Zap, Star, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [lastAction, setLastAction] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, (snapshot) => {
      setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleUserClick = async (item: any) => {
    setLoading(true);
    setLastAction(item);
    setIsOpen(true);
    setSelectedUser(null); // إعادة تهيئة البيانات قبل الجلب الجديد

    try {
      // البحث باستخدام userId الحقيقي لضمان بيانات دقيقة
      if (item.userId) {
        const userRef = doc(db, "users", item.userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setSelectedUser(userSnap.data());
        } else {
          // بيانات احتياطية في حال لم يتم العثور على ملف المستخدم
          setSelectedUser({
            username: item.username,
            totalEarned: item.points,
            level: 1,
            offersCompleted: 1
          });
        }
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
      {/* شريط الـ Live Feed العلوي */}
      <div className="w-full overflow-hidden bg-background/95 border-b-2 border-primary/20 py-2 shadow-sm">
        <div className="flex animate-scroll-fast items-center">
          {[...feedItems, ...feedItems].map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => handleUserClick(item)}
              className="flex items-center gap-3 px-8 min-w-fit border-r border-primary/10 cursor-pointer hover:bg-primary/5 transition-all active:scale-95"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-primary ring-2 ring-primary/10">
                  <AvatarImage src={item.photoURL} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{item.username?.[0]}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-background"></span>
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-foreground/90">{item.username}</span>
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span className="text-[11px] font-black text-yellow-500">+{item.points.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نافذة البروفايل الاحترافية */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
          {/* خلفية جمالية علوية */}
          <div className="h-32 bg-gradient-to-br from-primary/40 via-purple-600/20 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          </div>
          
          <div className="px-8 pb-10 -mt-16 flex flex-col items-center relative z-10">
            {/* الصورة الشخصية وشارة المستوى */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-[6px] border-[#0a0a0a] shadow-2xl transition-transform group-hover:scale-105 duration-300">
                <AvatarImage src={selectedUser?.photoURL || lastAction?.photoURL} />
                <AvatarFallback className="text-4xl bg-[#151515] font-black text-primary">
                  {lastAction?.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 px-5 py-1 rounded-full border-[3px] border-[#0a0a0a] flex items-center gap-1.5 shadow-lg">
                <Star className="h-3 w-3 fill-white text-white" />
                <span className="text-[11px] font-black italic tracking-tighter">LEVEL {selectedUser?.level || 1}</span>
              </div>
            </div>

            <h2 className="mt-8 text-2xl font-black tracking-tight text-white drop-shadow-md">
              {selectedUser?.username || lastAction?.username}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
               <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Active Earner</p>
            </div>

            {/* شبكة الإحصائيات الحقيقية */}
            <div className="grid grid-cols-3 gap-3 w-full mt-10 bg-gradient-to-b from-white/[0.07] to-transparent rounded-[2rem] p-6 border border-white/5">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-primary/10 rounded-xl mb-2 text-primary">
                  <Briefcase size={20} />
                </div>
                <span className="text-lg font-black">{selectedUser?.offersCompleted || 1}</span>
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Offers</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/10">
                <div className="p-2 bg-yellow-500/10 rounded-xl mb-2 text-yellow-500">
                  <Coins size={20} />
                </div>
                <span className="text-lg font-black text-yellow-500">
                  {(selectedUser?.totalEarned || lastAction?.points).toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Total Pts</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-2 bg-cyan-500/10 rounded-xl mb-2 text-cyan-500">
                  <Zap size={20} />
                </div>
                <span className="text-lg font-black">{selectedUser?.referralsCount || 0}</span>
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Refers</span>
              </div>
            </div>

            {/* تفاصيل النشاط الأخير */}
            <div className="w-full mt-8">
               <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em]">Recent Activity</h3>
                  <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-md text-[9px] font-bold text-green-500">VERIFIED</div>
               </div>
               
               <div className="bg-white/[0.03] p-5 rounded-[1.5rem] flex items-center justify-between border border-white/[0.05] hover:bg-white/[0.06] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-2xl shadow-[0_0_15px_rgba(var(--primary),0.4)] group-hover:rotate-12 transition-transform">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white leading-none mb-1 capitalize">
                        {lastAction?.offerName || "Task Completed"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1">
                        Via <span className="text-primary/80">{lastAction?.source}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-black text-yellow-500">+{lastAction?.points.toLocaleString()}</div>
                    <span className="text-[8px] text-muted-foreground font-medium uppercase">Points</span>
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
