"use client";

import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Partner } from "@/lib/types";

interface PartnerCardProps {
  partner: Partner;
  onClick?: () => void;
}

export function PartnerCard({ partner, onClick }: PartnerCardProps) {
  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border bg-card p-4 transition-all hover:border-primary/50"
      onClick={onClick}
    >
      {/* Badge */}
      {partner.badge && (
        <div className="absolute right-2 top-2">
          <Badge
            className="border-0 text-xs font-semibold"
            style={{ backgroundColor: partner.badgeColor || "#22c55e" }}
          >
            {partner.badge}
          </Badge>
        </div>
      )}

      {/* Logo */}
      <div className="mb-3 flex h-16 w-full items-center justify-center rounded-lg bg-muted/50">
        <span className="text-2xl font-bold text-primary">{partner.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-foreground">{partner.name}</h3>

      {/* Rating */}
      <div className="mt-1 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < partner.rating
                ? "fill-yellow-500 text-yellow-500"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    </Card>
  );
}
