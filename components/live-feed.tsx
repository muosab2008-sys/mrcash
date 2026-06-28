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
import { X, Trophy, Target, Users, Rocket, Coins } from "lucide-react";
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
  offersCompleted: number;
  referrals: number;
  level: number;
  avatarUrl: string;
  joinedAt?: { seconds: number } | null;
}

interface TooltipState {
  item: FeedItem;
  x: number;
  y: number;
}

/** Human readable "X ago" from a Firestore-style timestamp. */
function timeAgo(ts?: { seconds: number } | null): string {
  if (!ts?.seconds) return "recently";
  const diff = Math.max(0, Date.now() / 1000 - ts.seconds);
  if (diff < 60) return "just now";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function LiveFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [avatarsMap, setAvatarsMap] = useState<Record<string, string>>({});
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [paused, setPaused] = useState(false);

  const [selectedUser, setSelectedUser] = useState<(FeedItem & { currentAvatar: string }) | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userHistory, setUserHistory] = useState<FeedItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [mounted, setMounted] = useState(false);

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      // avoids stale-closure bugs).
      const idsToFetch = Array.from(new Set(items.map((i) => i.userId).filter(Boolean)));

      setAvatarsMap((prevMap) => {
        const missing = idsToFetch.filter((id) => !(id in prevMap));
        if (missing.length === 0) return prevMap;

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

  // ── 3. Tooltip positioning (rendered in a portal to escape overflow) ──
  const showTooltip = useCallback((e: React.MouseEvent, item: FeedItem) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      item,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
    });
  }, []);

  // ── 4. Open profile modal with real stats ─────────────────────────────
  const handleUserClick = async (item: FeedItem, currentAvatar: string) => {
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
            limit(8)
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
        totalEarned: u.totalEarned ?? u.points ?? item.points ?? 0,
        offersCompleted: u.offersCompleted ?? u.tasksCompleted ?? history.length,
        referrals: u.referrals ?? u.referralCount ?? 0,
        level: u.level ?? 1,
        avatarUrl: u.avatarUrl || u.photoURL || currentAvatar,
        joinedAt: u.createdAt ?? u.joinedAt ?? null,
      });
    } catch (error) {
      console.error("[v0] Error fetching user profile:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (feedItems.length === 0) return null;

  // Duplicate items for a seamless infinite marquee loop.
  const marqueeItems = [...feedItems, ...feedItems];
  // Keep speed consistent regardless of item count (~4s per item).
  const marqueeDuration = Math.max(20, feedItems.length * 4);
  const isPaused = paused || tooltip !== null;

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

        {/* Auto-scrolling marquee track */}
        <div
          className="flex-1 h-full overflow-hidden ml-[68px] sm:ml-20 rounded-r-full relative z-10 flex items-center"
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          onTouchCancel={() => setPaused(false)}
        >
          <div
            className={`flex items-center gap-3 px-4 w-max animate-scroll ${isPaused ? "is-paused" : ""}`}
            style={{ animationDuration: `${marqueeDuration}s` }}
          >
            {marqueeItems.map((item, index) => {
              const userAvatar = avatarsMap[item.userId] || "";
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="relative inline-flex items-center gap-2 px-3 py-1 bg-[#1c1c24]/40 hover:bg-[#1c1c24]/90 border border-white/[0.03] hover:border-cyan-500/30 rounded-full h-8 shrink-0 group/item shadow-sm transition-colors cursor-pointer"
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
                  User Name
                </span>
                <span className="font-bold text-white truncate block">{tooltip.item.username}</span>
              </div>
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
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-none bg-[#0d0d12] border border-white/10 rounded-2xl p-6 shadow-2xl text-white animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg z-10"
                aria-label="Close profile"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-4 pb-5">
                <div className="relative shrink-0">
                  <div className="p-0.5 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full">
                    <Avatar className="h-20 w-20 border-2 border-[#0d0d12]">
                      <AvatarImage
                        src={(userStats?.avatarUrl || selectedUser.currentAvatar) || undefined}
                        alt={selectedUser.username}
                      />
                      <AvatarFallback className="bg-[#13131a] text-cyan-400 text-2xl font-bold">
                        {selectedUser.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#0d0d12]">
                    Level {userStats?.level ?? 1}
                  </span>
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <h3 className="text-xl font-black tracking-wide text-white truncate">
                    {selectedUser.username}
                  </h3>
                  <span className="text-[12px] text-white/40 mt-1">
                    Joined: {loadingHistory ? "…" : timeAgo(userStats?.joinedAt)}
                  </span>
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/40 mb-3">
                <Trophy className="h-3.5 w-3.5 text-cyan-400" />
                <span>Statistics</span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-y border-white/5 py-5 mb-5">
                <div className="flex flex-col items-center text-center">
                  <Target className="h-4 w-4 text-cyan-400 mb-1.5" />
                  <span className="text-lg font-black text-white leading-none">
                    {loadingHistory ? "—" : userStats?.offersCompleted ?? 0}
                  </span>
                  <span className="text-[10px] text-white/40 mt-1.5">Offers Completed</span>
                </div>
                <div className="flex flex-col items-center text-center border-x border-white/5">
                  <Coins className="h-4 w-4 text-amber-400 mb-1.5" />
                  <span className="text-lg font-black text-amber-400 leading-none">
                    {loadingHistory ? "—" : (userStats?.totalEarned ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-white/40 mt-1.5">Total Earnings</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Users className="h-4 w-4 text-emerald-400 mb-1.5" />
                  <span className="text-lg font-black text-white leading-none">
                    {loadingHistory ? "—" : userStats?.referrals ?? 0}
                  </span>
                  <span className="text-[10px] text-white/40 mt-1.5">Users Referred</span>
                </div>
              </div>

              {/* Activity */}
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-white/40 mb-3">
                <Rocket className="h-3.5 w-3.5 text-purple-400" />
                <span>Activity</span>
              </div>

              {loadingHistory ? (
                <div className="text-center py-6 text-xs text-cyan-400/70 animate-pulse">
                  Synchronizing activity…
                </div>
              ) : userHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-white/30">
                  No recent activity found.
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-1 pb-2 border-b border-white/10 text-[11px] font-bold text-white/50">
                    <span>Name</span>
                    <span className="text-right w-20">Time</span>
                    <span className="text-right w-24">Reward</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {userHistory.map((historyItem, idx) => (
                      <div
                        key={`${historyItem.id}-${idx}`}
                        className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-1 py-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
                            <Rocket className="h-3.5 w-3.5 text-emerald-400" />
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white/90 truncate">
                              {historyItem.offerName || "Task Completed"}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {historyItem.source || "offer"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-white/40 text-right w-20">
                          {timeAgo(historyItem.createdAt)}
                        </span>
                        <span className="inline-flex items-center justify-end gap-1 text-xs font-black text-amber-400 text-right w-24">
                          <Coins className="h-3 w-3" />
                          {(historyItem.points || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
