"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Trophy, Target, Award, Calendar, Activity } from "lucide-react";

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [avatarsMap, setAvatarsMap] = useState<{ [key: string]: string }>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // مرجع لحاوية السحب بالماوس
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // 1️⃣ جلب التغذية الحية لآخر العروض
  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(20));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedItems(items);

      const newAvatarsMap: { [key: string]: string } = { ...avatarsMap };
      for (const item of items) {
        if (item.userId && !newAvatarsMap[item.userId]) {
          try {
            const userDocRef = doc(db, "users", item.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              newAvatarsMap[item.userId] = userData.avatarUrl || userData.photoURL || "";
            }
          } catch (err) {
            console.error("Error fetching user avatar:", err);
          }
        }
      }
      setAvatarsMap(newAvatarsMap);
    });

    return () => unsubscribe();
  }, []);

  // 2️⃣ حركية السحب بالماوس (Drag to Scroll) للشريط
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    scrollRef.current.classList.add("active");
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    isDown.current = false;
    if (scrollRef.current) {
      scrollRef.current.classList.remove("active");
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // سرعة السحب
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // 3️⃣ جلب تاريخ العمليات عند الضغط
  const handleUserClick = async (item: any) => {
    setSelectedUser(item);
    setLoadingHistory(true);
    setUserHistory([]);
    
    try {
      const q = query(
        collection(db, "live_feed"), 
        where("userId", "==", item.userId), 
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => doc.data());
      setUserHistory(history);
    } catch (error) {
      console.error("Error fetching user history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (feedItems.length === 0) return null;

  return (
    <div className="w-full flex flex-col justify-center py-4 bg-transparent select-none relative z-40">
      
      {/* الحاوية الرئيسية الخارجي */}
      <div className="relative flex items-center h-12 w-full backdrop-blur-md bg-[#13131a]/40 rounded-full border border-white/[0.05] shadow-lg overflow-visible">
        
        {/* شارة LIVE الثابتة جهة اليسار */}
        <div className="absolute left-0 top-0 bottom-0 z-30 bg-[#0d0d12] px-4 h-full flex items-center border-r border-white/[0.05] rounded-l-full shadow-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Live
            </span>
          </div>
        </div>

        {/* حاوية العناصر المعدلة لدعم السحب بالماوس + حل مشكلة الـ Overflow للـ Tooltip */}
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className="flex-1 h-full overflow-x-auto scrollbar-none ml-20 rounded-r-full relative z-10 flex items-center cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-3 px-4 pr-12 h-full">
            {feedItems.map((item, index) => {
              const itemId = `${item.id}-${index}`;
              const userAvatar = avatarsMap[item.userId] || "";

              return (
                <div
                  key={itemId}
                  className="relative inline-flex items-center gap-2 px-3 py-1 bg-[#1c1c24]/40 hover:bg-[#1c1c24]/90 border border-white/[0.03] hover:border-cyan-500/30 rounded-full h-8 group/item shadow-sm"
                  onMouseEnter={() => setActiveTooltip(itemId)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => handleUserClick({ ...item, currentAvatar: userAvatar })}
                >
                  <Avatar className="h-5 w-5 border border-white/10 pointer-events-none">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 text-[9px] font-bold">
                      {item.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center gap-1.5 text-[11px] pointer-events-none">
                    <span className="font-medium text-white/80 group-hover/item:text-white transition-colors truncate max-w-[80px]">
                      {item.username}
                    </span>
                    <span className="font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-full text-[10px]">
                      {(item.points || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* الـ Tooltip المنبثق المعدل مكانه لضمان الظهور فوق أي overflow بدون اختفاء */}
                  <div className={`
                    absolute bottom-[-95px] left-1/2 -translate-x-1/2 w-52 
                    bg-[#0d0d12] border border-white/10 rounded-xl p-3 shadow-[0_10px_25px_rgba(0,0,0,0.8)]
                    transition-all duration-150 z-[99] pointer-events-none
                    ${activeTooltip === itemId ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"}
                  `}>
                    <div className="space-y-1.5 text-left whitespace-normal text-[11px]">
                      <div className="flex flex-col border-b border-white/5 pb-1">
                        <span className="text-[9px] text-white/30 uppercase font-semibold tracking-wider">Offer Name</span>
                        <span className="font-bold text-white truncate block">{item.offerName || "Task Completed"}</span>
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <div>
                          <span className="text-[9px] text-white/30 block">Offerwall</span>
                          <span className="font-bold text-purple-400 text-[10px] uppercase">{item.source || "System"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-white/30 block">Reward</span>
                          <span className="font-black text-amber-400">{(item.points || 0).toLocaleString()} MC</span>
                        </div>
                      </div>
                    </div>
                    {/* السهم الصغير */}
                    <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0d0d12] border-t border-l border-white/10 rotate-45"></div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* تلاشي الحافة اليمنى */}
        <div className="absolute right-0 top-0 bottom-0 w-16 z-20 bg-gradient-to-l from-[#09090d] to-transparent pointer-events-none rounded-r-full" />
      </div>

      {/* 📥 نافذة الـ Modal الكبرى للبروفايل عند الضغط */}
      {selectedUser && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl p-6 shadow-2xl text-white space-y-5 overflow-hidden template-animate">
            <button 
              onClick={() => setSelectedUser(null)} 
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="p-0.5 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full">
                <Avatar className="h-12 w-12 border border-[#0d0d12]">
                  <AvatarImage src={selectedUser.currentAvatar} />
                  <AvatarFallback className="bg-[#13131a] text-cyan-400 text-base font-bold">
                    {selectedUser.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="text-base font-black tracking-wide text-white">{selectedUser.username}</h3>
                <div className="flex items-center gap-1 text-[11px] text-white/40 mt-0.5">
                  <Calendar className="h-3 w-3 text-cyan-400" />
                  <span>Active Member</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
                <Target className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[9px] text-white/40 uppercase font-bold block">Completed</span>
                <span className="text-xs font-bold text-white">{userHistory.length || 1} Tasks</span>
              </div>
              <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
                <Trophy className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                <span className="text-[9px] text-white/40 uppercase font-bold block">Total Earned</span>
                <span className="text-xs font-bold text-cyan-400">{(selectedUser.points || 0).toLocaleString()} MC</span>
              </div>
              <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
                <Award className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[9px] text-white/40 uppercase font-bold block">Rank</span>
                <span className="text-xs font-bold text-emerald-400">Level 1</span>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/30">
                <Activity className="h-3 w-3 text-purple-400" />
                <span>Recent Activity</span>
              </div>
              <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden max-h-44 overflow-y-auto scrollbar-none">
                {loadingHistory ? (
                  <div className="text-center py-6 text-xs text-cyan-400/70 animate-pulse">Synchronizing feed tracks...</div>
                ) : userHistory.length === 0 ? (
                  <div className="text-center py-6 text-xs text-white/30">No matching activities found.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {userHistory.map((historyItem, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/[0.01] transition-colors">
                        <div className="flex flex-col text-left max-w-[70%]">
                          <span className="text-xs font-bold text-white/90 truncate">{historyItem.offerName || "Task Completed"}</span>
                          <span className="text-[9px] text-cyan-400 font-semibold tracking-wide uppercase mt-0.5">{historyItem.source}</span>
                        </div>
                        <span className="text-xs font-black text-cyan-400 shrink-0">
                          +{historyItem.points} MC
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
