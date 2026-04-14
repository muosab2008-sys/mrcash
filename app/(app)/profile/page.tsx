"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Trophy,
  Calendar,
  Shield,
  Loader2,
  Save,
  Copy,
  Camera,
  DollarSign,
} from "lucide-react";

// Helper to convert points to USD
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

export default function ProfilePage() {
  const { userData, updateUserProfile, updateUserEmail, updateUserPassword, updateUserAvatar, logout } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(userData?.username || "");
  const [email, setEmail] = useState(userData?.email || "");
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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-[#3B82F6]/30 rounded-2xl">
            <AvatarImage src={userData?.photoURL || ""} alt={userData?.username || "User"} className="rounded-2xl" />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white rounded-2xl">
              {userData?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading === "avatar"}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
          <h1 className="text-2xl font-bold text-white">{userData?.username || "Profile"}</h1>
          <p className="text-white/50">
            Manage your account settings and view your stats
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-[#3B82F6]/20">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50">Balance</p>
              <p className="text-2xl font-black text-white">
                ${pointsToUSD(userData?.points || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50">Level</p>
              <p className="text-2xl font-black text-amber-500">
                {userData?.level || 1}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50">Total Earned</p>
              <p className="text-2xl font-black text-emerald-500">
                ${pointsToUSD(userData?.totalEarned || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] shadow-lg shadow-[#8B5CF6]/20">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/50">Joined</p>
              <p className="text-lg font-bold text-white">
                {userData?.createdAt?.toLocaleDateString() || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-white">Level {userData?.level || 1} Progress</span>
            </div>
            <span className="text-sm text-white/40">
              ${pointsToUSD(pointsInCurrentLevel)} / ${pointsToUSD(pointsNeededForLevel)}
            </span>
          </div>
          <div className="h-3 w-full bg-white/5 rounded-xl overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-500 rounded-xl" 
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* User ID */}
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Shield className="h-5 w-5 text-[#3B82F6]" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase text-white/30 tracking-widest">User ID</p>
            <div className="flex gap-2">
              <Input
                value={userData?.uid || ""}
                readOnly
                className="font-mono text-sm h-12 rounded-2xl bg-white/[0.02] border-white/5 text-white"
              />
              <Button variant="outline" onClick={copyUserId} className="rounded-2xl h-12 border-white/5 hover:bg-white/5">
                <Copy className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>

          {userData?.isAdmin && (
            <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 rounded-xl px-3 py-1.5">
              <Shield className="mr-1 h-3 w-3" />
              Administrator
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Update Username */}
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <User className="h-5 w-5 text-[#3B82F6]" />
            Update Username
          </CardTitle>
          <CardDescription className="text-white/40">Change your display name</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter new username"
              className="h-12 rounded-2xl bg-white/[0.02] border-white/5 focus:border-[#3B82F6]/50 text-white placeholder:text-white/20"
            />
            <Button
              onClick={handleUpdateUsername}
              disabled={loading === "username"}
              className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white h-12 rounded-2xl px-6"
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
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Mail className="h-5 w-5 text-[#3B82F6]" />
            Update Email
          </CardTitle>
          <CardDescription className="text-white/40">Change your email address</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter new email"
              className="h-12 rounded-2xl bg-white/[0.02] border-white/5 focus:border-[#3B82F6]/50 text-white placeholder:text-white/20"
            />
            <Button
              onClick={handleUpdateEmail}
              disabled={loading === "email"}
              className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white h-12 rounded-2xl px-6"
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
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Lock className="h-5 w-5 text-[#3B82F6]" />
            Update Password
          </CardTitle>
          <CardDescription className="text-white/40">Change your account password</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="h-12 rounded-2xl bg-white/[0.02] border-white/5 focus:border-[#3B82F6]/50 text-white placeholder:text-white/20"
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="h-12 rounded-2xl bg-white/[0.02] border-white/5 focus:border-[#3B82F6]/50 text-white placeholder:text-white/20"
          />
          <Button
            onClick={handleUpdatePassword}
            disabled={loading === "password"}
            className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white h-12 rounded-2xl"
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
      <Card className="border-red-500/20 bg-[#0a0a0a] rounded-2xl">
        <CardContent className="p-5">
          <Button
            variant="destructive"
            onClick={logout}
            className="w-full h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
