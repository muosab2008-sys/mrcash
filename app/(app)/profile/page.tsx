"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
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
  TrendingUp,
  Globe,
  ShieldCheck,
  ShieldOff,
  MapPin,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import { AvatarSelector } from "@/components/avatar-selector";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Points to USD conversion
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

export default function ProfilePage() {
  const { userData, updateUserProfile, updateUserEmail, updateUserPassword, updateUserAvatar, logout, user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(userData?.username || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "avatar">("profile");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(userData?.photoURL || null);

  // Update states when userData changes
  useEffect(() => {
    if (userData) {
      setUsername(userData.username || "");
      setEmail(userData.email || "");
      setSelectedAvatar(userData.photoURL || null);
    }
  }, [userData]);

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
    } catch {
      toast.error("Failed to update username");
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
    } catch {
      toast.error("Failed to update email. You may need to re-login.");
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
    } catch {
      toast.error("Failed to update password. You may need to re-login.");
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

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please use PNG or JPEG only.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

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
      toast.success("Profile picture updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setLoading(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || selectedAvatar === userData?.photoURL) {
      toast.info("No changes to save");
      return;
    }

    setLoading("avatar");
    try {
      await updateUserAvatar(selectedAvatar);
      toast.success("Avatar updated successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update avatar";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handle2FAComplete = () => {
    window.location.reload();
  };

  const handleDisable2FA = async () => {
    if (!user?.uid) return;
    
    setDisabling2FA(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });
      toast.success("Two-factor authentication disabled successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast.error("Failed to disable two-factor authentication");
    } finally {
      setDisabling2FA(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-6">
      <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
        {/* Header with Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20">
          <div className="relative group">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-primary/30 rounded-2xl shadow-xl">
              <AvatarImage src={userData?.photoURL || ""} alt={userData?.username || "User"} className="rounded-2xl object-cover" />
              <AvatarFallback className="text-3xl brand-gradient text-white rounded-2xl">
                {userData?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading === "avatar"}
              className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 border-2 border-background"
            >
              {loading === "avatar" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">{userData?.username || "Profile"}</h1>
            <p className="text-muted-foreground text-sm mt-1">{userData?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg px-3 py-1">
                <Trophy className="mr-1 h-3 w-3" />
                Level {userData?.level || 1}
              </Badge>
              {userData?.twoFactorEnabled && (
                <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg px-3 py-1">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  2FA Active
                </Badge>
              )}
              {userData?.isAdmin && (
                <Badge className="bg-primary/20 text-primary border border-primary/30 rounded-lg px-3 py-1">
                  <Shield className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary border border-border shrink-0">
                <Image src="/coin.png" alt="Points" width={28} height={28} className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Balance</p>
                <p className="text-xl font-black text-foreground truncate">
                  {(userData?.points || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-primary font-medium">= ${pointsToUSD(userData?.points || 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-amber-500/30 transition-colors">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Level</p>
                <p className="text-xl font-black text-amber-500">
                  {userData?.level || 1}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient shadow-lg glow-primary shrink-0">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Total Earned</p>
                <p className="text-xl font-black text-primary truncate">
                  {(userData?.totalEarned || 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-muted-foreground/30 transition-colors">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary border border-border shrink-0">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Joined</p>
                <p className="text-sm font-bold text-foreground truncate">
                  {userData?.createdAt?.toLocaleDateString() || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="font-bold text-foreground">Level {userData?.level || 1} Progress</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevel.toLocaleString()} MC
              </span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-xl overflow-hidden border border-border">
              <div 
                className="h-full brand-gradient transition-all duration-500 rounded-xl" 
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {(pointsNeededForLevel - pointsInCurrentLevel).toLocaleString()} MC needed to reach Level {(userData?.level || 1) + 1}
            </p>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-secondary/50 border border-border">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === "profile"
                ? "bg-card text-foreground shadow-lg border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === "security"
                ? "bg-card text-foreground shadow-lg border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
              activeTab === "avatar"
                ? "bg-card text-foreground shadow-lg border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Avatar</span>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* User ID */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">User ID</p>
                  <div className="flex gap-2">
                    <Input
                      value={userData?.uid || ""}
                      readOnly
                      className="font-mono text-xs h-12 rounded-xl bg-secondary/30 border-border"
                    />
                    <Button variant="outline" onClick={copyUserId} className="rounded-xl h-12 border-border hover:bg-secondary shrink-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Username */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Update Username
                </CardTitle>
                <CardDescription className="text-muted-foreground">Change your display name</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50 flex-1"
                  />
                  <Button
                    onClick={handleUpdateUsername}
                    disabled={loading === "username"}
                    className="brand-gradient text-white h-12 rounded-xl px-6 shrink-0"
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
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  Update Email
                </CardTitle>
                <CardDescription className="text-muted-foreground">Change your email address</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50 flex-1"
                  />
                  <Button
                    onClick={handleUpdateEmail}
                    disabled={loading === "email"}
                    className="brand-gradient text-white h-12 rounded-xl px-6 shrink-0"
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
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-4">
            {/* Update Password */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <Lock className="h-5 w-5 text-primary" />
                  Update Password
                </CardTitle>
                <CardDescription className="text-muted-foreground">Change your account password</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
                />
                <Button
                  onClick={handleUpdatePassword}
                  disabled={loading === "password"}
                  className="brand-gradient text-white h-12 rounded-xl w-full sm:w-auto px-8"
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

            {/* Two-Factor Authentication */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Secure your account with an extra layer of protection
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {userData?.twoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-500">2FA is Enabled</h3>
                          <p className="text-sm text-muted-foreground">
                            Your account is protected with two-factor authentication
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleDisable2FA}
                      disabled={disabling2FA}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      {disabling2FA ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldOff className="mr-2 h-4 w-4" />
                      )}
                      Disable Two-Factor Authentication
                    </Button>
                  </div>
                ) : (
                  <TwoFactorSetup
                    userId={userData?.uid || ""}
                    email={userData?.email || ""}
                    isEnabled={userData?.twoFactorEnabled || false}
                    onComplete={handle2FAComplete}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Avatar Tab */}
        {activeTab === "avatar" && (
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Change Your Avatar
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Select a new avatar from our collection
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-6">
              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onSelect={setSelectedAvatar}
              />
              <Button
                onClick={handleSaveAvatar}
                disabled={loading === "avatar" || selectedAvatar === userData?.photoURL}
                className="w-full h-12 rounded-xl brand-gradient text-white font-bold"
              >
                {loading === "avatar" ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Avatar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-destructive/20">
          <CardContent className="p-5">
            <Button
              variant="destructive"
              onClick={logout}
              className="w-full h-12 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
