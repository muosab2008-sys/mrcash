"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Trophy, Target, Award, Calendar, Activity } from "lucide-react";
import {
  requestNotificationPermissionAndToken,
  onForegroundMessage,
  showNativeNotification,
} from "@/lib/firebase-messaging";

interface FeedItem {
  id: string;
  userId: string;
  username: string;
  points: number;
  offerName?: string;
  source?: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

interface UserStats {
  totalEarned: number;
  points: number;
  level: number;
  tasksCompleted: number;
  avatarUrl: string;
}

interface TooltipState {
  item: FeedItem;
  x: number;
  y: number;
}

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [avatarsMap, setAvatarsMap] = useState<Record<string, string>>({});
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const [selectedUser, setSelectedUser] = useState<(FeedItem & { currentAvatar: string }) | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userHistory, setUserHistory] = useState<FeedItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [mounted, setMounted] = useState(false);

  // Drag-to-scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragMoved = useRef(false);

  // Notification de-duplication
  const seenFeedIds = useRef<Set<string>>(new Set());
  const isFirstSnapshot = useRef(true);

  useEffect(() => setMounted(true), []);

  // ── 1. Request push permission + foreground FCM listener ──────────────
  useEffect(() => {
    requestNotificationPermissionAndToken();

    let unsubscribe: (() => void) | undefined;
    onForegroundMessage((payload) => {
      const title = payload.notification?.title || "MrCash";
      const body = payload.notification?.body || "You have a new update.";
      showNativeNotification(title, body);
    }).then((fn) => {
      unsubscribe = fn;
    });

    return () => unsubscribe?.();
  }, []);

  // ── 2. Real-time live feed subscription + avatar lookup ───────────────
  useEffect(() => {
    const q = query(collection(db, "live_feed"), orderBy("createdAt", "desc"), limit(20));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items: FeedItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FeedItem, "id">),
      }));
      setFeedItems(items);

      // Fire native push for genuinely new credited transactions.
      if (!isFirstSnapshot.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const id = change.doc.id;
          if (seenFeedIds.current.has(id)) return;
          const data = change.doc.data() as Omit<FeedItem, "id">;
          if ((data.points || 0) > 0) {
            showNativeNotification(
              "Points Credited!",
              `Your account has been credited with +${(data.points || 0).toLocaleString()} points for completing ${
                data.offerName || "an offer"
              }.`
            );
          }
        });
      }
      snapshot.docs.forEach((d) => seenFeedIds.current.add(d.id));
      isFirstSnapshot.current = false;

      // Resolve avatars for any users we haven't seen yet (functional update
      // avoids stale-closure bugs from the old implementation).
      const idsToFetch = Array.from(
        new Set(items.map((i) => i.userId).filter(Boolean))
      );

      setAvatarsMap((prevMap) => {
        const missing = idsToFetch.filter((id) => !(id in prevMap));
        if (missing.length === 0) return prevMap;

        // Fetch missing avatars asynchronously, then merge.
        Promise.all(
          missing.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              const data = snap.exists() ? snap.data() : {};
              return [uid, data.avatarUrl || data.photoURL || ""] as const;
            } catch {
              return [uid, ""] as const;
            }
          })
        ).then((entries) => {
          setAvatarsMap((curr) => {
            const next = { ...curr };
            for (const [uid, url] of entries) next[uid] = url;
            return next;
          });
        });

        return prevMap;
      });
    });

    return () => unsubscribe();
  }, []);

  // ── 3. Drag-to-scroll handlers (desktop) ──────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    dragMoved.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const endDrag = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) dragMoved.current = true;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
    // Move tooltip with the bar while dragging.
    setTooltip(null);
  };

  // ── 4. Tooltip positioning (rendered in a portal to escape overflow) ──
  const showTooltip = useCallback((e: React.MouseEvent, item: FeedItem) => {
    if (isDown.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      item,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
    });
  }, []);

  // ── 5. Open profile modal with real stats ─────────────────────────────
  const handleUserClick = async (item: FeedItem, currentAvatar: string) => {
    if (dragMoved.current) return; // ignore click that ended a drag
    setSelectedUser({ ...item, currentAvatar });
    setTooltip(null);
    setLoadingHistory(true);
    setUserStats(null);
    setUserHistory([]);

    try {
      const [userSnap, historySnap] = await Promise.all([
        getDoc(doc(db, "users", item.userId)),
        getDocs(
          query(
            collection(db, "live_feed"),
            where("userId", "==", item.userId),
            orderBy("createdAt", "desc"),
            limit(5)
          )
        ),
      ]);

      const history: FeedItem[] = historySnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FeedItem, "id">),
      }));
      setUserHistory(history);

      const u = userSnap.exists() ? userSnap.data() : {};
      setUserStats({
        totalEarned: u.totalEarned ?? item.points ?? 0,
        points: u.points ?? 0,
        level: u.level ?? 1,
        tasksCompleted: u.tasksCompleted ?? history.length,
        avatarUrl: u.avatarUrl || u.photoURL || currentAvatar,
      });
    } catch (error) {
      console.error("[v0] Error fetching user profile:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (feedItems.length === 0) return null;

  return (
    <div className="w-full flex flex-col justify-center px-2 py-3 sm:py-4 bg-transparent select-none relative z-40">
      <div className="relative flex items-center h-12 w-full max-w-full backdrop-blur-md bg-[#13131a]/40 rounded-full border border-white/[0.05] shadow-lg overflow-hidden">
        {/* Fixed LIVE badge */}
        <div className="absolute left-0 top-0 bottom-0 z-30 bg-[#0d0d12] px-3 sm:px-4 h-full flex items-center border-r border-white/[0.05] rounded-l-full shadow-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Live
            </span>
          </div>
        </div>

        {/* Scrollable / draggable track */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={endDrag}
          onMouseUp={endDrag}
          onMouseMove={handleMouseMove}
          className="flex-1 h-full overflow-x-auto overflow-y-hidden scrollbar-none ml-[68px] sm:ml-20 rounded-r-full relative z-10 flex items-center cursor-grab active:cursor-grabbing touch-pan-x"
        >
          <div className="flex items-center gap-3 px-4 pr-12 h-full">
            {feedItems.map((item, index) => {
              const userAvatar = avatarsMap[item.userId] || "";
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="relative inline-flex items-center gap-2 px-3 py-1 bg-[#1c1c24]/40 hover:bg-[#1c1c24]/90 border border-white/[0.03] hover:border-cyan-500/30 rounded-full h-8 shrink-0 group/item shadow-sm transition-colors"
                  onMouseEnter={(e) => showTooltip(e, item)}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => handleUserClick(item, userAvatar)}
                >
                  <Avatar className="h-5 w-5 border border-white/10 pointer-events-none">
                    <AvatarImage src={userAvatar || undefined} alt={item.username} />
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Right edge fade */}
        <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 z-20 bg-gradient-to-l from-[#09090d] to-transparent pointer-events-none rounded-r-full" />
      </div>

      {/* Floating tooltip rendered in a portal so it is never clipped */}
      {mounted &&
        tooltip &&
        createPortal(
          <div
            className="fixed w-52 bg-[#0d0d12] border border-white/10 rounded-xl p-3 shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-[99] pointer-events-none -translate-x-1/2"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0d0d12] border-t border-l border-white/10 rotate-45" />
            <div className="space-y-1.5 text-left whitespace-normal text-[11px]">
              <div className="flex flex-col border-b border-white/5 pb-1">
                <span className="text-[9px] text-white/30 uppercase font-semibold tracking-wider">
                  Offer Name
                </span>
                <span className="font-bold text-white truncate block">
                  {tooltip.item.offerName || "Task Completed"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <div>
                  <span className="text-[9px] text-white/30 block">Offerwall</span>
                  <span className="font-bold text-purple-400 text-[10px] uppercase">
                    {tooltip.item.source || "System"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-white/30 block">Reward</span>
                  <span className="font-black text-amber-400">
                    {(tooltip.item.points || 0).toLocaleString()} MC
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Profile modal */}
      {mounted &&
        selectedUser &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl p-6 shadow-2xl text-white space-y-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                aria-label="Close profile"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <div className="p-0.5 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full">
                  <Avatar className="h-12 w-12 border border-[#0d0d12]">
                    <AvatarImage
                      src={(userStats?.avatarUrl || selectedUser.currentAvatar) || undefined}
                      alt={selectedUser.username}
                    />
                    <AvatarFallback className="bg-[#13131a] text-cyan-400 text-base font-bold">
                      {selectedUser.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-base font-black tracking-wide text-white">
                    {selectedUser.username}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-white/40 mt-0.5">
                    <Calendar className="h-3 w-3 text-cyan-400" />
                    <span>Active Member</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
                  <Target className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
                  <span className="text-[9px] text-white/40 uppercase font-bold block">
                    Completed
                  </span>
                  <span className="text-xs font-bold text-white">
                    {loadingHistory ? "—" : `${userStats?.tasksCompleted ?? 0} Tasks`}
                  </span>
                </div>
                <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
                  <Trophy className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                  <span className="text-[9px] text-white/40 uppercase font-bold block">
                    Total Earned
                  </span>
                  <span className="text-xs font-bold text-cyan-400">
                    {loadingHistory ? "—" : `${(userStats?.totalEarned ?? 0).toLocaleString()} MC`}
                  </span>
                </div>
                <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
                  <Award className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Rank</span>
                  <span className="text-xs font-bold text-emerald-400">
                    Level {userStats?.level ?? 1}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white/30">
                  <Activity className="h-3 w-3 text-purple-400" />
                  <span>Recent Activity</span>
                </div>
                <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden max-h-44 overflow-y-auto scrollbar-none">
                  {loadingHistory ? (
                    <div className="text-center py-6 text-xs text-cyan-400/70 animate-pulse">
                      Synchronizing feed tracks...
                    </div>
                  ) : userHistory.length === 0 ? (
                    <div className="text-center py-6 text-xs text-white/30">
                      No matching activities found.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {userHistory.map((historyItem, idx) => (
                        <div
                          key={`${historyItem.id}-${idx}`}
                          className="flex items-center justify-between p-3 hover:bg-white/[0.01] transition-colors"
                        >
                          <div className="flex flex-col text-left max-w-[70%]">
                            <span className="text-xs font-bold text-white/90 truncate">
                              {historyItem.offerName || "Task Completed"}
                            </span>
                            <span className="text-[9px] text-cyan-400 font-semibold tracking-wide uppercase mt-0.5">
                              {historyItem.source || "System"}
                            </span>
                          </div>
                          <span className="text-xs font-black text-cyan-400 shrink-0">
                            +{(historyItem.points || 0).toLocaleString()} MC
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
