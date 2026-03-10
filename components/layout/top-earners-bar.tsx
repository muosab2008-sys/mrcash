"use client";

import { useRef, useEffect } from "react";
import { mockTopEarners } from "@/lib/mock-data";
import { Coins } from "lucide-react";

export function TopEarnersBar() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Duplicate earners for infinite scroll effect
  const duplicatedEarners = [...mockTopEarners, ...mockTopEarners];

  return (
    <div className="relative w-full overflow-hidden bg-card/50 py-2">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden whitespace-nowrap"
        style={{ scrollBehavior: "auto" }}
      >
        {duplicatedEarners.map((earner, index) => (
          <div
            key={`${earner.id}-${index}`}
            className="flex shrink-0 items-center gap-2 rounded-full bg-card px-3 py-1.5"
          >
            {/* Avatar */}
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-pink-300 to-pink-100">
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-pink-800">
                {earner.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {earner.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {earner.partnerName}
              </span>
            </div>

            {/* Points */}
            <div className="ml-2 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-500">
                {earner.points}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
