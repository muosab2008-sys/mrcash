"use client";

import {
  Users,
  Gift,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Mock admin stats
const adminStats = {
  totalUsers: 1250,
  newUsersToday: 45,
  totalOffers: 156,
  activeOffers: 142,
  pendingWithdrawals: 23,
  processedToday: 67,
  totalEarnings: 1567890,
  earningsToday: 12450,
};

const statCards = [
  {
    title: "Total Users",
    value: adminStats.totalUsers.toLocaleString(),
    change: `+${adminStats.newUsersToday} today`,
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Active Offers",
    value: adminStats.activeOffers.toLocaleString(),
    change: `${adminStats.totalOffers} total`,
    changeType: "neutral" as const,
    icon: Gift,
  },
  {
    title: "Pending Withdrawals",
    value: adminStats.pendingWithdrawals.toLocaleString(),
    change: `${adminStats.processedToday} processed today`,
    changeType: "neutral" as const,
    icon: Wallet,
  },
  {
    title: "Total Points Earned",
    value: adminStats.totalEarnings.toLocaleString(),
    change: `+${adminStats.earningsToday.toLocaleString()} today`,
    changeType: "positive" as const,
    icon: DollarSign,
  },
];

// Mock recent activity
const recentActivity = [
  {
    id: "1",
    type: "withdrawal",
    user: "john_doe",
    details: "Requested PayPal withdrawal",
    points: 5000,
    time: "2 minutes ago",
  },
  {
    id: "2",
    type: "earning",
    user: "sarah_smith",
    details: "Completed Rock N' Cash Casino",
    points: 15642,
    time: "5 minutes ago",
  },
  {
    id: "3",
    type: "signup",
    user: "new_user_123",
    details: "New user registered",
    points: 0,
    time: "10 minutes ago",
  },
  {
    id: "4",
    type: "withdrawal",
    user: "mike_jones",
    details: "Approved Bitcoin withdrawal",
    points: 10000,
    time: "15 minutes ago",
  },
  {
    id: "5",
    type: "earning",
    user: "emma_wilson",
    details: "Completed Wild Fish Explorer",
    points: 6590,
    time: "20 minutes ago",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your platform metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {stat.changeType === "positive" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    ) : stat.changeType === "negative" ? (
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    ) : null}
                    <span
                      className={cn(
                        "text-xs",
                        stat.changeType === "positive"
                          ? "text-primary"
                          : stat.changeType === "negative"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-bold text-foreground">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    activity.type === "withdrawal"
                      ? "bg-orange-500/10 text-orange-500"
                      : activity.type === "earning"
                      ? "bg-primary/10 text-primary"
                      : "bg-blue-500/10 text-blue-500"
                  )}
                >
                  {activity.type === "withdrawal" ? (
                    <Wallet className="h-5 w-5" />
                  ) : activity.type === "earning" ? (
                    <DollarSign className="h-5 w-5" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {activity.user}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.details}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {activity.points > 0 && (
                  <p className="font-bold text-foreground">
                    {activity.points.toLocaleString()} pts
                  </p>
                )}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
