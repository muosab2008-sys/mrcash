"use client";

import { useAuth } from "@/lib/auth-context";
import {
  Coins,
  TrendingUp,
  Gift,
  ArrowRight,
  Trophy,
  Wallet,
  Star,
} from "lucide-react";
import Link from "next/link";

const offerCompanies = [
  { name: "Adlexy", color: "from-primary/20 to-primary/5", available: 12 },
  { name: "TaskWall", color: "from-accent/20 to-accent/5", available: 8 },
  { name: "BagiraWall", color: "from-primary/20 to-accent/5", available: 15 },
  { name: "Offery", color: "from-accent/20 to-primary/5", available: 6 },
  { name: "Gemiad", color: "from-primary/20 to-primary/5", available: 10 },
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
              {user?.displayName?.split(" ")[0] || "User"}
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
          icon={<Coins className="h-5 w-5" />}
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
                  5 offer walls available
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        <Link
          href="/withdraw"
          className="group bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-accent" />
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
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {offerCompanies.map((company) => (
            <Link
              href="/offers"
              key={company.name}
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center`}
                >
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-sm">
                    {company.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {company.available}
                    {" offers available"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
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
        <div
          className={`${
            accent === "primary" ? "text-primary" : "text-accent"
          }`}
        >
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
