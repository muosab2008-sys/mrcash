"use client";

import { Coins, Monitor, Smartphone, Apple } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Offer } from "@/lib/types";

interface OfferCardProps {
  offer: Omit<Offer, "createdAt">;
  onClick?: () => void;
}

const platformIcons = {
  android: Smartphone,
  ios: Apple,
  desktop: Monitor,
};

export function OfferCard({ offer, onClick }: OfferCardProps) {
  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return points.toLocaleString();
    }
    return points.toString();
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      {/* Platform Badges */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        {offer.platforms.map((platform) => {
          const Icon = platformIcons[platform];
          return (
            <div
              key={platform}
              className="flex h-6 w-6 items-center justify-center rounded bg-background/80 backdrop-blur"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          );
        })}
      </div>

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <span className="text-4xl font-bold text-primary/40">
            {offer.name.charAt(0)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {offer.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {offer.description}
        </p>

        {/* Points */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1">
            <Coins className="h-3 w-3 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-500">
              {formatPoints(offer.points)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
