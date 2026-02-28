"use client";

import { useAuth } from "@/lib/auth-context";
import {
  DollarSign,
  TrendingUp,
  Gift,
  ArrowRight,
  Trophy,
  Wallet,
  Star,
} from "lucide-react";
import Link from "next/link";

const offerCompanies = [
  { name: "PlayTimeAds", displayName: "playtimeads", badge: "Trendify", badgeColor: "bg-amber-500", stars: 5 },
  { name: "adtowall", displayName: "adtowall", badge: "TrueLeads", badgeColor: "bg-emerald-500", stars: 5 },
  { name: "GemiAd", displayName: "gemiad", badge: "TrustOffers", badgeColor: "bg-orange-500", stars: 4 },
  { name: "Offery", displayName: "offery", badge: "2X", badgeColor: "bg-red-500", stars: 5 },
  { name: "lootably", displayName: "lootably", badge: "PromoWall", badgeColor: "bg-green-400", stars: 4 },
  { name: "TASKWALL", displayName: "taskwall", badge: "Trendify", badgeColor: "bg-amber-500", stars: 5 },
];

export function Dashboard() {
  const { user, balance } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {"Welcome back, "}
            <span className="text-primary">
              {user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "User"}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete offers to earn points and cash out
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Current Balance"
          value={`${balance.toLocaleString()} pts`}
          accent="primary"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Cash Value"
          value={`$${(balance / 100).toFixed(2)}`}
          accent="accent"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Offers Done"
          value="--"
          accent="primary"
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Total Withdrawn"
          value="$0.00"
          accent="accent"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/offers"
          className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Browse Offers</h3>
                <p className="text-xs text-muted-foreground">
                  12+ offer walls available
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        <Link
          href="/withdraw"
          className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Withdraw Funds
                </h3>
                <p className="text-xs text-muted-foreground">
                  Min. 500 points to withdraw
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </div>

      {/* Available offer walls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">
            Offer Walls
          </h2>
          <Link
            href="/offers"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {offerCompanies.map((company) => (
            <Link
              href="/offers"
              key={company.name}
              className="offer-card-glow group bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-all flex flex-col items-center text-center gap-2"
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-wider text-foreground px-2 py-0.5 rounded-full ${company.badgeColor}`}
              >
                {company.badge}
              </span>
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {company.name}
              </span>
              <span className="text-[10px] text-muted-foreground">{company.displayName}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < company.stars ? "star-filled fill-current" : "star-empty"
                    }`}
                  />
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "primary" | "accent";
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
