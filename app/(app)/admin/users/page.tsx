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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  Copy,
  ArrowLeft,
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
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

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
            createdAt: d.createdAt?.toDate() || new Date(),
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

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.uid.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[var(--brand-cyan)]" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all registered users
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[var(--brand-cyan)]">{users.length}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {users.filter((u) => !u.isBanned).length}
            </p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {users.filter((u) => u.isBanned).length}
            </p>
            <p className="text-sm text-muted-foreground">Banned Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
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
                  className="flex items-center justify-between rounded-lg bg-secondary p-4 animate-pulse"
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
                  className={`rounded-lg border p-4 transition-colors ${
                    user.isBanned
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border bg-secondary"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{user.username}</span>
                        {user.isAdmin && (
                          <Badge className="bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)] border-0 text-xs">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        {user.isBanned && (
                          <Badge className="bg-destructive/10 text-destructive border-0 text-xs">
                            <Ban className="mr-1 h-3 w-3" />
                            Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
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
                          <p className="font-bold text-[var(--brand-cyan)]">
                            {user.points.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <div>
                          <p className="font-bold text-[var(--brand-purple)]">
                            {user.fragments.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Fragments</p>
                        </div>
                        <div>
                          <p className="font-bold text-amber-500">Lv.{user.level}</p>
                          <p className="text-xs text-muted-foreground">Level</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
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
                      </div>
                    </div>
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
