"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Trophy,
  Coins,
  Zap,
  Calendar,
  Shield,
  Loader2,
  Save,
  Copy,
  Camera,
} from "lucide-react";

export default function ProfilePage() {
  const { userData, updateUserProfile, updateUserEmail, updateUserPassword, updateUserAvatar, logout } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(userData?.username || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Calculate level progress
  const currentLevelThreshold = (userData?.level || 1) * 10000;
  const previousLevelThreshold = ((userData?.level || 1) - 1) * 10000;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setLoading("username");
    try {
      await updateUserProfile(username);
      toast.success("Username updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update username");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      toast.error("Email cannot be empty");
      return;
    }

    setLoading("email");
    try {
      await updateUserEmail(email);
      toast.success("Email updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email. You may need to re-login.");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading("password");
    try {
      await updateUserPassword(newPassword);
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password. You may need to re-login.");
    } finally {
      setLoading(null);
    }
  };

  const copyUserId = async () => {
    if (userData?.uid) {
      await navigator.clipboard.writeText(userData.uid);
      toast.success("User ID copied to clipboard");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.uid) return;

    setLoading("avatar");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userData.uid);

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await response.json();
      await updateUserAvatar(url);
      toast.success("Avatar updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setLoading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-[var(--brand-cyan)]/30">
            <AvatarImage src={userData?.photoURL || ""} alt={userData?.username || "User"} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-[var(--brand-cyan)] to-[var(--brand-purple)] text-white">
              {userData?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading === "avatar"}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-cyan)] text-white shadow-lg hover:bg-[var(--brand-purple)] transition-colors disabled:opacity-50"
          >
            {loading === "avatar" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold">{userData?.username || "Profile"}</h1>
          <p className="text-muted-foreground">
            Manage your account settings and view your stats
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient">
              <Coins className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points</p>
              <p className="text-2xl font-bold text-[var(--brand-cyan)]">
                {userData?.points.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-purple)]">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fragments</p>
              <p className="text-2xl font-bold text-[var(--brand-purple)]">
                {userData?.fragments.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="text-2xl font-bold text-amber-500">
                {userData?.level || 1}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="text-lg font-bold text-emerald-500">
                {userData?.createdAt.toLocaleDateString() || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Level {userData?.level || 1} Progress</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevel.toLocaleString()} pts
            </span>
          </div>
          <Progress value={levelProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* User ID */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--brand-cyan)]" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">User ID</p>
            <div className="flex gap-2">
              <Input
                value={userData?.uid || ""}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copyUserId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {userData?.isAdmin && (
            <Badge className="bg-[var(--brand-cyan)]/10 text-[var(--brand-cyan)] border-0">
              <Shield className="mr-1 h-3 w-3" />
              Administrator
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Update Username */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Update Username
          </CardTitle>
          <CardDescription>Change your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter new username"
            />
            <Button
              onClick={handleUpdateUsername}
              disabled={loading === "username"}
              className="brand-gradient text-primary-foreground"
            >
              {loading === "username" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Email */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Update Email
          </CardTitle>
          <CardDescription>Change your email address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter new email"
            />
            <Button
              onClick={handleUpdateEmail}
              disabled={loading === "email"}
              className="brand-gradient text-primary-foreground"
            >
              {loading === "email" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Password */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Update Password
          </CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
          <Button
            onClick={handleUpdatePassword}
            disabled={loading === "password"}
            className="brand-gradient text-primary-foreground"
          >
            {loading === "password" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-destructive/30 bg-card">
        <CardContent className="p-4">
          <Button
            variant="destructive"
            onClick={logout}
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
