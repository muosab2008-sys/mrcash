"use client";

import { useState } from "react";
import {
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Settings,
  Bell,
  Building,
  Coins,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [recordsPerPage, setRecordsPerPage] = useState("10");

  // Show loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Get user data from auth context (dynamic, not hardcoded)
  const displayName = userProfile?.displayName || user?.displayName || "User";
  const joinDate = userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : "Recently joined";
  const totalEarnings = userProfile?.totalEarnings || 0;
  const availableBalance = userProfile?.points || 0;
  const referralCount = userProfile?.referralCount || 0;
  const completedOffers = userProfile?.completedOffers || 0;

  // User's earnings history (would come from Firebase in production)
  const userEarnings = userProfile?.earningsHistory || [];
  const userWithdrawals = userProfile?.withdrawals || [];
  const pendingWithdrawals = userWithdrawals.filter((w: { status: string }) => w.status === "pending");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Account Information</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Info Card */}
        <Card className="border-border bg-card p-6">
          <div className="flex items-start gap-4">
            {/* Avatar - shows user's avatar or initial */}
            <div className="relative">
              {userProfile?.avatarUrl ? (
                <img 
                  src={userProfile.avatarUrl} 
                  alt={displayName}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-4 ring-primary/20">
                  <span className="text-3xl font-bold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {userProfile?.level || 1}
              </div>
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {displayName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Joined: {joinDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-muted-foreground hover:text-foreground">
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Balance & Settings */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Available Balance
                    </p>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-foreground">
                        {availableBalance}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Private</p>
                    </div>
                    <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Notifications</p>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Card */}
        <Card className="border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Statistics</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-xl font-bold text-foreground">
                    {totalEarnings}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Users Referred</p>
                <span className="text-xl font-bold text-foreground">
                  {referralCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Earnings last 30 days
                </p>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-xl font-bold text-foreground">
                    {userProfile?.earningsLast30Days || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Completed Earning
                </p>
                <span className="text-xl font-bold text-foreground">
                  {completedOffers}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Section */}
      <Card className="border-border bg-card">
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="earnings"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Building className="mr-2 h-4 w-4" />
              Withdrawals
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Clock className="mr-2 h-4 w-4" />
              Withdrawals In Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">NAME</TableHead>
                  <TableHead className="text-muted-foreground">POINTS</TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    TIME
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userEarnings.length > 0 ? (
                  userEarnings.map((earning: { id: string; name: string; points: number; timestamp: string }) => (
                    <TableRow key={earning.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm text-foreground">
                            {earning.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{earning.points}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {earning.timestamp}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No earnings yet. Complete offers to earn points!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={recordsPerPage} onValueChange={setRecordsPerPage}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  Records per page
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Showing {userEarnings.length > 0 ? 1 : 0} to {userEarnings.length} of {userEarnings.length} Results
              </span>
            </div>
          </TabsContent>

          <TabsContent value="withdrawals" className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">METHOD</TableHead>
                  <TableHead className="text-muted-foreground">POINTS</TableHead>
                  <TableHead className="text-muted-foreground">ADDRESS</TableHead>
                  <TableHead className="text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    TIME
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userWithdrawals.filter((w: { status: string }) => w.status !== "pending").length > 0 ? (
                  userWithdrawals
                    .filter((w: { status: string }) => w.status !== "pending")
                    .map((withdrawal: { id: string; method: string; points: number; address: string; status: string; timestamp: string }) => (
                      <TableRow key={withdrawal.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                              <span className="text-xs font-bold text-primary">
                                {withdrawal.method.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium">{withdrawal.method}</span>
                          </div>
                        </TableCell>
                        <TableCell>{withdrawal.points}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {withdrawal.address}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={withdrawal.status === "approved" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {withdrawal.timestamp}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No withdrawals yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={recordsPerPage} onValueChange={setRecordsPerPage}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  Records per page
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Showing {userWithdrawals.length > 0 ? 1 : 0} to {userWithdrawals.length} of {userWithdrawals.length} Results
              </span>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">METHOD</TableHead>
                  <TableHead className="text-muted-foreground">POINTS</TableHead>
                  <TableHead className="text-muted-foreground">ADDRESS</TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    TIME
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawals.length > 0 ? (
                  pendingWithdrawals.map((withdrawal: { id: string; method: string; points: number; address: string; timestamp: string }) => (
                    <TableRow key={withdrawal.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-500/10">
                            <Clock className="h-4 w-4 text-yellow-500" />
                          </div>
                          <span className="font-medium">{withdrawal.method}</span>
                        </div>
                      </TableCell>
                      <TableCell>{withdrawal.points}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {withdrawal.address}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {withdrawal.timestamp}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      NO RECORDS FOUND
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
