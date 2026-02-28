"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { ArrowLeft, ExternalLink, X, Star, Shield } from "lucide-react";

interface OfferWall {
  id: string;
  name: string;
  description: string;
  getUrl: (uid: string) => string;
  tag: string;
}

const offerWalls: OfferWall[] = [
  {
    id: "adlexy",
    name: "Adlexy",
    description: "Complete surveys, watch videos, and install apps to earn points.",
    getUrl: (uid) =>
      `https://adlexy.com/offerwall/h7mx23bis2zaib6apwwe73uv3gr92i/${uid}`,
    tag: "Popular",
  },
  {
    id: "taskwall",
    name: "TaskWall",
    description: "High-paying tasks and offers from top advertisers.",
    getUrl: (uid) =>
      `https://wall.taskwall.io/?app_id=e723adebdbab293255deefe5fe401b43&userid=${uid}`,
    tag: "High Pay",
  },
  {
    id: "bagirawall",
    name: "BagiraWall",
    description: "Wide variety of offers with fast crediting system.",
    getUrl: (uid) => `https://bagirawall.com/offerwall/7/${uid}`,
    tag: "Fast Credit",
  },
  {
    id: "offery",
    name: "Offery",
    description: "Premium offers with high conversion rates and bonuses.",
    getUrl: (uid) =>
      `https://offery.xyz/offerwall/?app_key=YOUR_APP_KEY&subId=${uid}`,
    tag: "Bonus",
  },
  {
    id: "gemiad",
    name: "Gemiad",
    description: "Global offers available in multiple regions and languages.",
    getUrl: (uid) =>
      `https://wall.gemiad.com/view/6977536ec6ceefce12a28330?userid=${uid}`,
    tag: "Global",
  },
];

export function OffersPage() {
  const { user } = useAuth();
  const [activeWall, setActiveWall] = useState<OfferWall | null>(null);

  if (!user) return null;

  if (activeWall) {
    return (
      <div className="flex flex-col h-[calc(100vh-96px)]">
        {/* Iframe header */}
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

        {/* Iframe */}
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
          <p className="text-sm text-foreground font-medium">
            How it works
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select an offer wall below, complete the available tasks (surveys,
            app installs, etc.), and your points will be credited to your
            balance automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offerWalls.map((wall) => (
          <button
            key={wall.id}
            onClick={() => setActiveWall(wall)}
            className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {wall.tag}
              </span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {wall.name}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {wall.description}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
              Open offers <ExternalLink className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
