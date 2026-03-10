"use client";

import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Partner } from "@/lib/types";

interface PartnerBannerProps {
  partner: Partner;
  onClick?: () => void;
}

export function PartnerBanner({ partner, onClick }: PartnerBannerProps) {
  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border bg-gradient-to-r from-card to-card/80"
      onClick={onClick}
    >
      <div className="flex h-[180px] items-center justify-between p-6">
        {/* Left Content */}
        <div className="flex flex-col gap-2">
          {/* Badge */}
          {partner.badge && (
            <Badge
              className="w-fit border-0 text-xs font-semibold"
              style={{ backgroundColor: partner.badgeColor || "#f97316" }}
            >
              {partner.badge}
            </Badge>
          )}

          {/* Logo/Name */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-lg font-bold">{partner.name.charAt(0)}</span>
            </div>
            <span className="text-lg font-bold text-foreground">{partner.name}</span>
          </div>

          {/* Banner Text */}
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-foreground">
              {partner.bannerTitle || "START EARN"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {partner.bannerSubtitle || "Earn up to 250$ every day"}
            </p>
          </div>
        </div>

        {/* Right - Play Button */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
          <Play className="h-6 w-6 fill-current" />
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent" />
    </Card>
  );
}
