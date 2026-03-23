"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Coins,
  TrendingUp,
  ArrowRight,
  Activity,
  Clock,
  Shield,
  Gift,
  Ticket,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Stats {
  totalUsers: number;
  activeToday: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
}

interface Transaction {
  id: string;
  type: "earn" | "withdraw" | "referral" | "bonus";
  userId: string;
  username: string;
  amount: number;
  createdAt: Date;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeToday: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; users: number; earnings: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch total users
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
    });

    // Fetch pending withdrawals
    const withdrawalsQuery = query(
      collection(db, "withdrawals"),
      where("status", "==", "pending")
    );
    const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      const total = snapshot.docs.reduce((acc, doc) => acc + doc.data().amount, 0);
      setStats((prev) => ({
        ...prev,
        pendingWithdrawals: snapshot.size,
        totalWithdrawals: total,
      }));
    });

    // Fetch recent transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type,
            userId: d.userId,
            username: d.username,
            amount: d.amount,
            createdAt: d.createdAt?.toDate() || new Date(),
          };
        }) as Transaction[];
        setRecentTransactions(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    // Generate mock daily data for charts
    const mockDailyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        users: Math.floor(Math.random() * 50) + 10,
        earnings: Math.floor(Math.random() * 50000) + 10000,
      };
    });
    setDailyData(mockDailyData);

    return () => {
      unsubscribeUsers();
      unsubscribeWithdrawals();
      unsubscribeTransactions();
    };
  }, []);

  const adminLinks = [
    { href: "/admin/users", label: "Manage Users", icon: Users, description: "View, ban, and manage users" },
    { href: "/admin/withdrawals", label: "Withdrawals", icon: DollarSign, description: "Process withdrawal requests" },
    { href: "/admin/giveaways", label: "Giveaways", icon: Gift, description: "Manage giveaway prizes" },
    { href: "/admin/promo", label: "Promo Codes", icon: Ticket, description: "Create and manage promo codes" },
    { href: "/admin/offerwalls", label: "Offerwalls", icon: Settings, description: "Configure offerwall settings" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--brand-cyan)]" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage your rewards platform
          </p>
        </div>
        <Badge className="bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)] border-0">
          <Activity className="mr-1 h-3 w-3" />
          Live
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-[var(--brand-cyan)]">
                {(stats.activeToday || 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Today</p>
              <p className="text-2xl font-bold text-emerald-500">
                {stats.activeToday.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-amber-500">
                {stats.pendingWithdrawals}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-purple)]">
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-bold text-[var(--brand-purple)]">
                ${stats.totalWithdrawals.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
            <CardDescription>User activity over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--brand-cyan)"
                    strokeWidth={2}
                    dot={{ fill: "var(--brand-cyan)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Points Earned</CardTitle>
            <CardDescription>Total points earned by users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="earnings" fill="var(--brand-purple)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="border-border bg-card transition-all hover:border-[var(--brand-cyan)]/50 hover:shadow-lg hover:shadow-[var(--brand-cyan)]/10">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <Icon className="h-5 w-5 text-[var(--brand-cyan)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{link.label}</p>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Transaction Flow
          </CardTitle>
          <CardDescription>Real-time transaction activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary p-3 animate-pulse"
                >
                  <div className="h-5 w-40 bg-muted rounded" />
                  <div className="h-5 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg bg-secondary p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        tx.type === "earn"
                          ? "bg-emerald-500"
                          : tx.type === "withdraw"
                          ? "bg-amber-500"
                          : "bg-[var(--brand-purple)]"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{tx.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {tx.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        tx.type === "withdraw" ? "text-amber-500" : "text-emerald-500"
                      }`}
                    >
                      {tx.type === "withdraw" ? "-" : "+"}
                      {tx.amount.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
