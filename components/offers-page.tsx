"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { ArrowLeft, ExternalLink, X, Star, Shield } from "lucide-react";

interface OfferWall {
  id: string;
  name: string;
  displayName: string;
  description: string;
  getUrl: (uid: string) => string;
  badge: string;
  badgeColor: string;
  stars: number;
}

const offerWalls: OfferWall[] = [
  {
    id: "adlexy",
    name: "Adlexy",
    displayName: "adlexy",
    description: "Complete offers and earn points from top advertisers worldwide.",
    getUrl: (uid) =>
      `https://adlexy.com/offerwall/h7mx23bis2zaib6apwwe73uv3gr92i/${uid}`,
    badge: "Trendify",
    badgeColor: "bg-amber-500",
    stars: 5,
  },
  {
    id: "taskwall",
    name: "TaskWall",
    displayName: "taskwall",
    description: "High-paying tasks and offers from top advertisers.",
    getUrl: (uid) =>
      `https://wall.taskwall.io/?app_id=e723adebdbab293255deefe5fe401b43&userid=${uid}`,
    badge: "TrueLeads",
    badgeColor: "bg-emerald-500",
    stars: 5,
  },
  {
    id: "bagirawall",
    name: "BagiraWall",
    displayName: "bagirawall",
    description: "Wide variety of surveys and mobile offers with fast crediting.",
    getUrl: (uid) =>
      `https://bagirawall.com/offerwall/7/${uid}`,
    badge: "TrustOffers",
    badgeColor: "bg-orange-500",
    stars: 4,
  },
  {
    id: "offery",
    name: "Offery",
    displayName: "offery",
    description: "Premium offers with high conversion rates and bonuses.",
    // تم حذف https:// المتكررة وتصحيح رابط المتغير
    getUrl: (uid) =>
      `https://offery.io/offerwall/?app_key=rvzyjt0dpo0ogh392veso95xr1ok01&user_id=${uid}`, 
    badge: "2X",
    badgeColor: "bg-red-500",
    stars: 5,
  },
  {
    id: "gemiad",
    name: "GemiAd",
    displayName: "gemiad",
    description: "Global offers available in multiple regions with great payouts.",
    getUrl: (uid) =>
      `https://gemiadwall.com/6977536ec6ceefce12a28330?userid=${uid}`,
    badge: "PureReward",
    badgeColor: "bg-emerald-500",
    stars: 4,
  }
];

export function OffersPage() {
  const { user } = useAuth();
  const [activeWall, setActiveWall] = useState<OfferWall | null>(null);

  if (!user) return null;

  if (activeWall) {
    return (
      <div className="flex flex-col h-[calc(100vh-96px)]">
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveWall(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close offer wall"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                {activeWall.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Complete offers to earn points
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={activeWall.getUrl(user.uid)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={() => setActiveWall(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <iframe
          src={activeWall.getUrl(user.uid)}
          title={`${activeWall.name} Offer Wall`}
          className="flex-1 w-full border-0 bg-background"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Offer Walls</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose an offer wall and start earning points
        </p>
      </div>

      <div className="bg-card border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground font-medium">How it works</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select an offer wall below, complete the available tasks (surveys,
            app installs, etc.), and your points will be credited to your
            balance automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {offerWalls.map((wall) => (
          <button
            key={wall.id}
            onClick={() => setActiveWall(wall)}
            className="offer-card-glow text-center bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group flex flex-col items-center gap-2"
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider text-foreground px-2.5 py-0.5 rounded-full ${wall.badgeColor}`}
            >
              {wall.badge}
            </span>
            <div className="h-10 flex items-center justify-center">
              <span className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {wall.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{wall.displayName}</p>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < wall.stars ? "star-filled fill-current" : "star-empty"
                  }`}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
