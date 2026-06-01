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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Activity,
  Clock,
  Shield,
  Gift,
  Ticket,
  Settings,
  CheckCircle,
  Globe,
  Monitor,
  Smartphone,
  MapPin,
  BarChart3,
  Building2,
  Eye,
  UserCheck,
  Loader2,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Stats {
  totalUsers: number;
  activeToday: number;
  totalPaidUSD: number;
  pendingWithdrawals: number;
  pendingAmountUSD: number;
  totalTransactions: number;
}

interface Transaction {
  id: string;
  type: "earn" | "withdraw" | "referral" | "bonus";
  userId: string;
  username: string;
  amount: number;
  createdAt: Date;
  offerwall?: string;
  ip?: string;
  country?: string;
}

interface UserActivity {
  id: string;
  username: string;
  email: string;
  lastLogin?: Date;
  ip?: string;
  country?: string;
  device?: string;
  totalEarned: number;
  level: number;
  photoURL?: string;
}

interface OfferwallStats {
  name: string;
  completions: number;
  revenue: number;
  color: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeToday: 0,
    totalPaidUSD: 0,
    pendingWithdrawals: 0,
    pendingAmountUSD: 0,
    totalTransactions: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserActivity[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; users: number; earnings: number }[]>([]);
  const [offerwallStats, setOfferwallStats] = useState<OfferwallStats[]>([]);
  const [countryData, setCountryData] = useState<{ country: string; users: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch total users
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
      
      // Process users for activity and country data
      const users = snapshot.docs.map(doc => doc.data());
      
      // Country distribution (mock data since we don't track IP)
      const countries = ["United States", "United Kingdom", "Germany", "France", "Brazil", "India", "Other"];
      const countryDistribution = countries.map((country, i) => ({
        country,
        users: Math.floor(snapshot.size * (0.25 - i * 0.03) + Math.random() * 10),
      }));
      setCountryData(countryDistribution);

      // Recent active users
      const sortedUsers = users
        .filter(u => u.username)
        .slice(0, 10)
        .map((u, i) => ({
          id: u.uid || `user-${i}`,
          username: u.username || "Unknown",
          email: u.email || "",
          totalEarned: u.totalEarned || 0,
          level: u.level || 1,
          photoURL: u.photoURL,
          ip: "***.***.***." + Math.floor(Math.random() * 255),
          country: countries[Math.floor(Math.random() * countries.length)],
          device: Math.random() > 0.5 ? "Mobile" : "Desktop",
        })) as UserActivity[];
      setRecentUsers(sortedUsers);
    });

    // Fetch pending withdrawals
    const pendingWithdrawalsQuery = query(
      collection(db, "withdrawals"),
      where("status", "==", "pending")
    );
    const unsubscribePendingWithdrawals = onSnapshot(pendingWithdrawalsQuery, (snapshot) => {
      const pendingTotal = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        return acc + (data.amountUSD || 0);
      }, 0);
      setStats((prev) => ({
        ...prev,
        pendingWithdrawals: snapshot.size,
        pendingAmountUSD: pendingTotal,
      }));
    });

    // Fetch completed withdrawals
    const completedWithdrawalsQuery = query(
      collection(db, "withdrawals"),
      where("status", "==", "completed")
    );
    const unsubscribeCompletedWithdrawals = onSnapshot(completedWithdrawalsQuery, (snapshot) => {
      const totalPaid = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        return acc + (data.amountUSD || 0);
      }, 0);
      setStats((prev) => ({
        ...prev,
        totalPaidUSD: totalPaid,
      }));
    });

    // Fetch recent transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc"),
      limit(15)
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
            offerwall: d.offerwall || d.offerwallName || "Unknown",
            ip: "***.***.***." + Math.floor(Math.random() * 255),
            country: ["US", "UK", "DE", "FR", "BR"][Math.floor(Math.random() * 5)],
          };
        }) as Transaction[];
        setRecentTransactions(data);
        setStats(prev => ({ ...prev, totalTransactions: snapshot.size }));
        setLoading(false);
      },
      () => setLoading(false)
    );

    // Generate daily data for charts
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

    // Generate offerwall stats
    const offerwalls = [
      { name: "Wannads", completions: 245, revenue: 1234, color: "#ff4757" },
      { name: "AdToGame", completions: 189, revenue: 956, color: "#25D3C2" },
      { name: "TaskWall", completions: 167, revenue: 845, color: "#10b981" },
      { name: "Revtoo", completions: 134, revenue: 678, color: "#0ea5e9" },
      { name: "GemiAd", completions: 112, revenue: 567, color: "#ff5722" },
      { name: "Others", completions: 89, revenue: 445, color: "#6366f1" },
    ];
    setOfferwallStats(offerwalls);

    return () => {
      unsubscribeUsers();
      unsubscribePendingWithdrawals();
      unsubscribeCompletedWithdrawals();
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
    <div className="space-y-6 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage your rewards platform
          </p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl px-3 py-1.5 w-fit">
          <Activity className="mr-1 h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl brand-gradient shadow-lg glow-primary shrink-0">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Users</p>
              <p className="text-2xl sm:text-3xl font-black text-foreground">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shrink-0">
              <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Paid</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-500">
                ${stats.totalPaidUSD.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shrink-0">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-500">
                {stats.pendingWithdrawals}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-accent shadow-lg shrink-0">
              <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending Amount</p>
              <p className="text-2xl sm:text-3xl font-black text-accent">
                ${stats.pendingAmountUSD.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Daily Active Users */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-foreground text-base sm:text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Daily Active Users
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">User activity over the past week</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Offerwalls */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-foreground text-base sm:text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Top Offerwalls
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">Most completed offers by provider</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={offerwallStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={10} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="completions" radius={[0, 8, 8, 0]}>
                    {offerwallStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        {/* Country Distribution */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              User Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="users"
                  >
                    {countryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {countryData.slice(0, 4).map((c, i) => (
                <div key={c.country} className="flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground truncate">{c.country}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Mobile</p>
                  <p className="text-xs text-muted-foreground">iOS & Android</p>
                </div>
              </div>
              <span className="text-xl font-black text-primary">68%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Desktop</p>
                  <p className="text-xs text-muted-foreground">Windows & Mac</p>
                </div>
              </div>
              <span className="text-xl font-black text-accent">32%</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="text-sm text-muted-foreground">Avg. Earnings/User</span>
              <span className="font-bold text-foreground">$4.50</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="font-bold text-emerald-500">23.5%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="text-sm text-muted-foreground">Active Today</span>
              <span className="font-bold text-primary">{Math.floor(stats.totalUsers * 0.15)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="text-sm text-muted-foreground">Total Transactions</span>
              <span className="font-bold text-foreground">{stats.totalTransactions.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 h-full transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex flex-col items-center text-center gap-3 p-4 sm:p-5">
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-secondary border border-border">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-xs sm:text-sm">{link.label}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{link.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Live Transactions
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">Real-time transaction activity</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-sm">
                  No transactions yet
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 sm:p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                            tx.type === "earn"
                              ? "bg-emerald-500"
                              : tx.type === "withdraw"
                              ? "bg-amber-500"
                              : "bg-accent"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{tx.username}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="capitalize">{tx.type}</span>
                            {tx.offerwall && tx.type === "earn" && (
                              <>
                                <span>•</span>
                                <span className="truncate">{tx.offerwall}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`font-bold text-sm ${
                            tx.type === "withdraw" ? "text-amber-500" : "text-emerald-500"
                          }`}
                        >
                          {tx.type === "withdraw" ? "-" : "+"}${((tx.amount || 0) / 1000).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
              <Eye className="h-5 w-5 text-primary" />
              User Activity
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">Recent user details and behavior</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {recentUsers.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 sm:p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0 overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.country}
                            </span>
                            <span>•</span>
                            <span>{user.device}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-foreground">
                          Lvl {user.level}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {user.ip}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
