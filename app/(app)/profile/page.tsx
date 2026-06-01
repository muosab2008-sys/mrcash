"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
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
  Shuffle,
  Check,
  Smartphone,
  Key,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  Download,
} from "lucide-react";
import Image from "next/image";
import { AvatarSelector } from "@/components/avatar-selector";
import { TwoFactorSetup } from "@/components/two-factor-setup";
import { PWAInstallButton } from "@/components/pwa-install-button";

// Points to USD conversion
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

export default function ProfilePage() {
  const { user, userData, updateUserProfile, updateUserEmail, updateUserPassword, updateUserAvatar, logout } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(userData?.username || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Avatar selection state
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(userData?.photoURL || null);
  
  // 2FA disable state
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  
  // Active section for mobile tabs
  const [activeSection, setActiveSection] = useState<"profile" | "avatar" | "security">("profile");

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
      setShowAvatarSelector(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update avatar");
    } finally {
      setLoading(null);
    }
  };

  const handleDisable2FA = async () => {
    if (!user || !disablePassword) {
      toast.error("Please enter your password");
      return;
    }

    setDisabling2FA(true);
    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email!, disablePassword);
      await reauthenticateWithCredential(user, credential);

      // Disable 2FA in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      toast.success("Two-factor authentication has been disabled");
      setShowDisable2FA(false);
      setDisablePassword("");
      
      // Refresh page to update state
      window.location.reload();
    } catch (error: any) {
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        toast.error("Incorrect password. Please try again.");
      } else {
        toast.error("Failed to disable 2FA. Please try again.");
      }
    } finally {
      setDisabling2FA(false);
    }
  };

  const handle2FAComplete = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header with Avatar */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-primary/30 rounded-xl">
            <AvatarImage src={userData?.photoURL || ""} alt={userData?.username || "User"} className="rounded-xl" />
            <AvatarFallback className="text-2xl brand-gradient text-white rounded-xl">
              {userData?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading === "avatar"}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
            accept="image/jpeg,image/png"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold text-foreground">{userData?.username || "Profile"}</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
          <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
            {userData?.twoFactorEnabled && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg px-2 py-1 text-xs">
                <ShieldCheck className="mr-1 h-3 w-3" />
                2FA Active
              </Badge>
            )}
            {userData?.isAdmin && (
              <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-2 py-1 text-xs">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary border border-border">
              <Image src="/coin.png" alt="Points" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-black text-foreground">
                {(userData?.points || 0).toLocaleString()}
              </p>
              <p className="text-xs text-primary">= ${pointsToUSD(userData?.points || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="text-2xl font-black text-amber-500">
                {userData?.level || 1}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl brand-gradient shadow-lg glow-primary">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-black text-primary">
                {(userData?.totalEarned || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">= ${pointsToUSD(userData?.totalEarned || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary border border-border">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="text-lg font-bold text-foreground">
                {userData?.createdAt?.toLocaleDateString() || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
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
        </CardContent>
      </Card>

      {/* Section Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/50 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection("profile")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all text-sm ${
            activeSection === "profile"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveSection("avatar")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all text-sm ${
            activeSection === "avatar"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="w-4 h-4" />
          Avatar
        </button>
        <button
          onClick={() => setActiveSection("security")}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all text-sm ${
            activeSection === "security"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>
      </div>

      {/* Profile Section */}
      {activeSection === "profile" && (
        <div className="space-y-6">
          {/* User ID */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Shield className="h-5 w-5 text-primary" />
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
                    className="font-mono text-sm h-12 rounded-xl bg-secondary/30 border-border"
                  />
                  <Button variant="outline" onClick={copyUserId} className="rounded-xl h-12 border-border hover:bg-secondary">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Username */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <User className="h-5 w-5 text-primary" />
                Update Username
              </CardTitle>
              <CardDescription className="text-muted-foreground">Change your display name</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex gap-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
                />
                <Button
                  onClick={handleUpdateUsername}
                  disabled={loading === "username"}
                  className="brand-gradient text-white h-12 rounded-xl px-6"
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
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Update Email
              </CardTitle>
              <CardDescription className="text-muted-foreground">Change your email address</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter new email"
                  className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
                />
                <Button
                  onClick={handleUpdateEmail}
                  disabled={loading === "email"}
                  className="brand-gradient text-white h-12 rounded-xl px-6"
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
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Lock className="h-5 w-5 text-primary" />
                Update Password
              </CardTitle>
              <CardDescription className="text-muted-foreground">Change your account password</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-12 rounded-xl bg-secondary/30 border-border focus:border-primary/50"
              />
              <Button
                onClick={handleUpdatePassword}
                disabled={loading === "password"}
                className="brand-gradient text-white h-12 rounded-xl"
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

          {/* Install App */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Download className="h-5 w-5 text-primary" />
                Install App
              </CardTitle>
              <CardDescription className="text-muted-foreground">Add MrCash to your device for quick access</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <PWAInstallButton variant="card" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Avatar Section */}
      {activeSection === "avatar" && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Camera className="h-5 w-5 text-primary" />
                Change Your Avatar
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Select a new avatar from our collection or upload your own
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-6">
              {/* Upload custom avatar */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-primary/30 rounded-xl">
                    <AvatarImage src={userData?.photoURL || ""} className="rounded-xl" />
                    <AvatarFallback className="text-xl brand-gradient text-white rounded-xl">
                      {userData?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Upload Custom Image</p>
                  <p className="text-xs text-muted-foreground">PNG or JPEG, max 2MB</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading === "avatar"}
                  className="rounded-xl border-border"
                >
                  {loading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground font-medium">Or choose from gallery</span>
                </div>
              </div>

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
        </div>
      )}

      {/* Security Section */}
      {activeSection === "security" && (
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Secure your account with an extra layer of protection
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {userData?.twoFactorEnabled ? (
                <div className="space-y-4">
                  {/* 2FA Enabled Status */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">2FA Enabled</h3>
                        <p className="text-sm text-muted-foreground">
                          Your account is protected with two-factor authentication
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Disable 2FA Toggle */}
                  {!showDisable2FA ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowDisable2FA(true)}
                      className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <ShieldOff className="mr-2 h-4 w-4" />
                      Disable Two-Factor Authentication
                    </Button>
                  ) : (
                    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4">
                      <div className="flex items-start gap-3">
                        <ShieldOff className="w-5 h-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Confirm Disable 2FA</p>
                          <p className="text-sm text-muted-foreground">
                            Enter your password to disable two-factor authentication
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          type="password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="h-12 rounded-xl bg-secondary/30 border-border"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDisable2FA(false);
                            setDisablePassword("");
                          }}
                          className="flex-1 h-11 rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDisable2FA}
                          disabled={disabling2FA || !disablePassword}
                          className="flex-1 h-11 rounded-xl"
                        >
                          {disabling2FA ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Disable 2FA"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
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

          {/* Security Tips */}
          <Card className="backdrop-blur-xl bg-background/40 border border-white/10">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                <Key className="h-5 w-5 text-primary" />
                Security Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
                  Use a strong, unique password for your account.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
                  Enable two-factor authentication for extra security.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">3</span>
                  Never share your password or 2FA codes with anyone.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logout */}
      <Card className="backdrop-blur-xl bg-background/40 border border-destructive/20">
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
  );
}
