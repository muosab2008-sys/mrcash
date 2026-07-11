"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Loader2, Rocket, BarChart3, Users, Trophy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedItem } from "@/app/api/live-feed/route";
import type { UserProfile } from "@/app/api/live-feed/[uid]/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(ms: number): string {
  if (!ms) return "just now";
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function formatPoints(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(4).replace(/\.?0+$/, "");
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Coin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <Image
      src="/coin.png"
      alt="MC"
      width={16}
      height={16}
      className={`${className} object-contain shrink-0`}
    />
  );
}

function TickerItem({
  item,
  onSelect,
}: {
  item: FeedItem;
  onSelect: (uid: string) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onSelect(item.userId)}
          className="flex h-14 w-56 shrink-0 items-center gap-2.5 rounded-xl border border-border bg-card/60 px-3 transition-all hover:border-primary/40 hover:bg-secondary/60"
        >
          <Avatar className="h-8 w-8 shrink-0 border border-border">
            <AvatarImage src={item.photoURL || undefined} alt={item.username} />
            <AvatarFallback className="bg-secondary text-[10px] font-bold text-foreground">
              {initials(item.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
            <span className="w-full truncate text-left text-xs font-bold text-foreground">
              {item.username}
            </span>
            <span className="w-full truncate text-left text-[10px] text-muted-foreground">
              {item.company}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-secondary/80 px-2 py-1">
            <Coin className="w-3.5 h-3.5" />
            <span className="text-xs font-bold text-primary">
              {formatPoints(item.reward)}
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-xs rounded-xl border border-border bg-card p-3 text-left shadow-2xl"
      >
        <div className="space-y-1 text-xs">
          <p className="text-foreground">
            <span className="text-muted-foreground">User Name: </span>
            <span className="font-bold">{item.username}</span>
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Offer Name: </span>
            <span className="font-bold">{item.offerName}</span>
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Offerwall: </span>
            <span className="font-bold">{item.company}</span>
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Reward: </span>
            <span className="font-bold text-primary">
              {formatPoints(item.reward)} points
            </span>
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function UserProfileModal({
  uid,
  onClose,
}: {
  uid: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useSWR<UserProfile>(
    uid ? `/api/live-feed/${uid}` : null,
    fetcher,
  );

  return (
    <Dialog open={!!uid} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border-border bg-card p-0 text-foreground">
        {isLoading || !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-primary/60">
                  <AvatarImage src={data.photoURL || undefined} alt={data.username} />
                  <AvatarFallback className="bg-secondary text-xl font-bold">
                    {initials(data.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  Level {data.level}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black">{data.username}</h2>
                <p className="text-sm text-muted-foreground">
                  Joined:{" "}
                  {data.joinedAtMs
                    ? new Date(data.joinedAtMs).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-6 border-t border-border pt-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">Statistics</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black">{data.offersCompleted}</p>
                  <p className="text-[11px] text-muted-foreground">Offers Completed</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-2xl font-black">
                    <Coin className="w-5 h-5" />
                    {formatPoints(data.totalEarnings)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Total Earnings</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-2xl font-black">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    {data.usersReferred}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Users Referred</p>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="mt-6 border-t border-border pt-5">
              <div className="mb-3 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">Activity</h3>
              </div>

              {data.activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.activities.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary">
                                <Rocket className="h-3.5 w-3.5 text-primary" />
                              </span>
                              <div className="min-w-0">
                                <p className="max-w-[150px] truncate font-bold text-foreground">
                                  {a.offerName}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {a.company}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                            {timeAgo(a.createdAtMs)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <span className="flex items-center gap-1 font-bold text-primary">
                              <Coin className="w-3.5 h-3.5" />
                              {formatPoints(a.reward)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// One card is 224px wide (w-56) plus a 12px gap (gap-3).
const STEP = 236;

export function LiveFeedTicker() {
  const { data } = useSWR<{ items: FeedItem[] }>("/api/live-feed", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, startX: 0, startScroll: 0, moved: false });

  const items = data?.items || [];
  const count = items.length;

  // Auto-advance one rectangle every 3 seconds (paused while hovering/dragging).
  useEffect(() => {
    if (count === 0 || paused) return;
    const t = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const setWidth = count * STEP;
      // Loop seamlessly: once we've scrolled past one full set, jump back.
      if (el.scrollLeft >= setWidth) {
        el.scrollTo({ left: el.scrollLeft - setWidth, behavior: "auto" });
      }
      el.scrollBy({ left: STEP, behavior: "smooth" });
    }, 3000);
    return () => clearInterval(t);
  }, [count, paused]);

  // Drag-to-scroll (pointer works for both mouse and touch).
  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el || !dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    if (Math.abs(delta) > 4) dragState.current.moved = true;
    el.scrollLeft = dragState.current.startScroll - delta;
  };

  const endDrag = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    dragState.current.dragging = false;
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  if (count === 0) return null;

  // Repeat items so there are always enough cards to fill and loop the strip.
  const needed = count * 3 + 6;
  const display = Array.from({ length: needed }, (_, i) => items[i % count]);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div
          className="flex items-center gap-3 px-3 py-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-secondary/70 px-2.5 py-1 sm:flex">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
              Live Wins
            </span>
          </div>
          <div
            ref={scrollRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="no-scrollbar relative flex-1 cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing"
          >
            <div className="flex w-max gap-3">
              {display.map((item, i) => (
                <TickerItem
                  key={`${item.id}-${i}`}
                  item={item}
                  onSelect={(uid) => {
                    // Ignore the click that ends a drag gesture.
                    if (dragState.current.moved) return;
                    setSelectedUid(uid);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <UserProfileModal uid={selectedUid} onClose={() => setSelectedUid(null)} />
    </TooltipProvider>
  );
}
