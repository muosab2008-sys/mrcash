"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  Search,
  Shield,
  Ban,
  CheckCircle,
  Copy,
  ArrowLeft,
  Plus,
  Minus,
  Loader2,
  Globe,
  Clock,
  MapPin,
  Monitor,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

interface User {
  uid: string;
  username: string;
  email: string;
  points: number;
  fragments: number;
  level: number;
  totalEarned: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: Date;
  // Real IP and session data
  lastLoginIP?: string;
  registrationIP?: string;
  lastLoginAt?: Date;
  userAgent?: string;
  country?: string;
  city?: string;
  sessionCount?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  // Points dialog state
  const [pointsDialog, setPointsDialog] = useState<{
    open: boolean;
    type: "add" | "deduct";
    user: User | null;
  }>({ open: false, type: "add", user: null });
  const [pointsAmount, setPointsAmount] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            uid: doc.id,
            username: d.username,
            email: d.email,
            points: d.points || 0,
            fragments: d.fragments || 0,
            level: d.level || 1,
            totalEarned: d.totalEarned || 0,
            isAdmin: d.isAdmin || false,
            isBanned: d.isBanned || false,
            createdAt: (d.createdAt && typeof d.createdAt.toDate === 'function') ? d.createdAt.toDate() : new Date(),
            // Real IP and session data
            lastLoginIP: d.lastLoginIP || null,
            registrationIP: d.registrationIP || null,
            lastLoginAt: d.lastLoginAt?.toDate ? d.lastLoginAt.toDate() : null,
            userAgent: d.userAgent || null,
            country: d.country || null,
            city: d.city || null,
            sessionCount: d.sessionCount || 0,
          };
        }) as User[];
        setUsers(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const toggleBan = async (user: User) => {
    setUpdatingUser(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isBanned: !user.isBanned,
      });
      toast.success(user.isBanned ? "User unbanned" : "User banned");
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setUpdatingUser(null);
    }
  };

  const toggleAdmin = async (user: User) => {
    setUpdatingUser(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isAdmin: !user.isAdmin,
      });
      toast.success(user.isAdmin ? "Admin removed" : "Admin granted");
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setUpdatingUser(null);
    }
  };

  const copyUserId = async (uid: string) => {
    await navigator.clipboard.writeText(uid);
    toast.success("User ID copied");
  };

  const copyIP = async (ip: string) => {
    await navigator.clipboard.writeText(ip);
    toast.success("IP address copied");
  };

  const openPointsDialog = (user: User, type: "add" | "deduct") => {
    setPointsDialog({ open: true, type, user });
    setPointsAmount("");
  };

  const closePointsDialog = () => {
    setPointsDialog({ open: false, type: "add", user: null });
    setPointsAmount("");
  };

  const handlePointsAction = async () => {
    const amount = parseInt(pointsAmount);
    if (isNaN(amount) || amount <= 0 || !pointsDialog.user) {
      toast.error("Please enter a valid amount");
      return;
    }

    setUpdatingUser(pointsDialog.user.uid);
    try {
      const pointsChange = pointsDialog.type === "add" ? amount : -amount;
      const userRef = doc(db, "users", pointsDialog.user.uid);
      
      await updateDoc(userRef, {
        points: increment(pointsChange),
        ...(pointsDialog.type === "add" ? { totalEarned: increment(amount) } : {}),
      });

      toast.success(
        pointsDialog.type === "add"
          ? `Added ${amount.toLocaleString()} points to ${pointsDialog.user.username}`
          : `Deducted ${amount.toLocaleString()} points from ${pointsDialog.user.username}`
      );
      closePointsDialog();
    } catch (error: any) {
      toast.error(error.message || "Failed to update points");
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
     (user.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.uid || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.lastLoginIP || "").includes(search) ||
      (user.registrationIP || "").includes(search)
  );

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all registered users with real IP logs
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-border bg-card rounded-2xl">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, ID, or IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border bg-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{users.length}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {users.filter((u) => !u.isBanned).length}
            </p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {users.filter((u) => u.isBanned).length}
            </p>
            <p className="text-sm text-muted-foreground">Banned Users</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">
              {users.filter((u) => u.isAdmin).length}
            </p>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-border bg-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">All Users</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {users.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-secondary p-4 animate-pulse"
                >
                  <div className="h-5 w-40 bg-muted rounded" />
                  <div className="h-5 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No users found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className={`rounded-xl border transition-colors ${
                    user.isBanned
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border bg-secondary/50"
                  }`}
                >
                  {/* Main User Row */}
                  <div className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{user.username || "Unknown User"}</span>
                          {user.isAdmin && (
                            <Badge className="bg-primary/10 text-primary border-0 text-xs rounded-lg">
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          {user.isBanned && (
                            <Badge className="bg-destructive/10 text-destructive border-0 text-xs rounded-lg">
                              <Ban className="mr-1 h-3 w-3" />
                              Banned
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email || "No Email Provided"}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {user.uid.slice(0, 12)}...
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyUserId(user.uid)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <p className="font-bold text-primary">
                              {user.points?.toLocaleString() ?? "0"}
                            </p>
                            <p className="text-xs text-muted-foreground">Points</p>
                          </div>
                          <div>
                            <p className="font-bold text-accent">
                              {user.fragments?.toLocaleString() ?? "0"}
                            </p>
                            <p className="text-xs text-muted-foreground">Fragments</p>
                          </div>
                          <div>
                            <p className="font-bold text-amber-500">Lv.{user.level}</p>
                            <p className="text-xs text-muted-foreground">Level</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPointsDialog(user, "add")}
                            disabled={updatingUser === user.uid}
                            className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 rounded-lg"
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPointsDialog(user, "deduct")}
                            disabled={updatingUser === user.uid}
                            className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10 rounded-lg"
                          >
                            <Minus className="mr-1 h-4 w-4" />
                            Deduct
                          </Button>
                          
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-muted-foreground">Admin</span>
                            <Switch
                              checked={user.isAdmin}
                              onCheckedChange={() => toggleAdmin(user)}
                              disabled={updatingUser === user.uid}
                            />
                          </div>
                          <Button
                            variant={user.isBanned ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => toggleBan(user)}
                            disabled={updatingUser === user.uid}
                            className="rounded-lg"
                          >
                            {user.isBanned ? (
                              <>
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="mr-1 h-4 w-4" />
                                Ban
                              </>
                            )}
                          </Button>
                          
                          {/* Expand/Collapse button for details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedUser(expandedUser === user.uid ? null : user.uid)}
                            className="rounded-lg"
                          >
                            {expandedUser === user.uid ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details - IP Logs and Session Info */}
                  {expandedUser === user.uid && (
                    <div className="border-t border-border p-4 bg-background/50 rounded-b-xl">
                      <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Session & IP Information
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Registration IP */}
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Registration IP</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-foreground">
                              {user.registrationIP || "Not recorded"}
                            </span>
                            {user.registrationIP && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyIP(user.registrationIP!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Last Login IP */}
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Last Login IP</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-foreground">
                              {user.lastLoginIP || "Not recorded"}
                            </span>
                            {user.lastLoginIP && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyIP(user.lastLoginIP!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Location</span>
                          </div>
                          <span className="text-sm text-foreground">
                            {user.city && user.country 
                              ? `${user.city}, ${user.country}` 
                              : user.country || "Unknown"}
                          </span>
                        </div>

                        {/* Last Login */}
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-accent" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Last Login</span>
                          </div>
                          <span className="text-sm text-foreground">
                            {formatDate(user.lastLoginAt)}
                          </span>
                        </div>

                        {/* Registration Date */}
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Registered</span>
                          </div>
                          <span className="text-sm text-foreground">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>

                        {/* Session Count */}
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">Sessions</span>
                          </div>
                          <span className="text-sm text-foreground">
                            {user.sessionCount || 0} total
                          </span>
                        </div>

                        {/* User Agent */}
                        <div className="p-3 rounded-lg bg-secondary/50 border border-border sm:col-span-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">User Agent</span>
                          </div>
                          <span className="text-xs text-foreground break-all">
                            {user.userAgent || "Not recorded"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points Dialog */}
      <Dialog open={pointsDialog.open} onOpenChange={closePointsDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pointsDialog.type === "add" ? (
                <>
                  <Plus className="h-5 w-5 text-emerald-500" />
                  Add Points
                </>
              ) : (
                <>
                  <Minus className="h-5 w-5 text-orange-500" />
                  Deduct Points
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pointsDialog.type === "add" ? "Add" : "Deduct"} points{" "}
              {pointsDialog.type === "add" ? "to" : "from"}{" "}
              <span className="font-semibold text-foreground">
                {pointsDialog.user?.username}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <span className="font-bold text-primary">
                {pointsDialog.user?.points?.toLocaleString() || 0} points
              </span>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Amount to {pointsDialog.type === "add" ? "add" : "deduct"}
              </label>
              <Input
                type="number"
                placeholder="Enter points amount"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                min="1"
                className="rounded-xl"
              />
            </div>

            {pointsAmount && !isNaN(parseInt(pointsAmount)) && parseInt(pointsAmount) > 0 && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm text-muted-foreground">New Balance:</p>
                <p className={`text-lg font-bold ${pointsDialog.type === "add" ? "text-emerald-500" : "text-orange-500"}`}>
                  {(
                    (pointsDialog.user?.points || 0) +
                    (pointsDialog.type === "add" ? parseInt(pointsAmount) : -parseInt(pointsAmount))
                  ).toLocaleString()}{" "}
                  points
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePointsDialog} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handlePointsAction}
              disabled={updatingUser === pointsDialog.user?.uid}
              className={`rounded-xl ${
                pointsDialog.type === "add"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {updatingUser === pointsDialog.user?.uid ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : pointsDialog.type === "add" ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <Minus className="mr-2 h-4 w-4" />
              )}
              {pointsDialog.type === "add" ? "Add Points" : "Deduct Points"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
