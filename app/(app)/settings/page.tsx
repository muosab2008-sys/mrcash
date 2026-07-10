"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, User, Shield, Save } from "lucide-react";
import { AvatarSelector } from "@/components/avatar-selector";
import { TwoFactorSetup } from "@/components/two-factor-setup";

export default function SettingsPage() {
  const router = useRouter();
  const { user, userData, updateUserAvatar, loading: authLoading } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    userData?.photoURL || null
  );
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"avatar" | "2fa">("avatar");

  // Redirect if not logged in
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  if (authLoading || !userData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  const handleSaveAvatar = async () => {
    if (!selectedAvatar || selectedAvatar === userData.photoURL) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      await updateUserAvatar(selectedAvatar);
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update avatar");
    } finally {
      setSaving(false);
    }
  };

  const handle2FAComplete = () => {
    // Force refresh user data
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and security settings
            </p>
          </div>
        </div>

        {/* Current Profile Card */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary">
              {userData.photoURL ? (
                <Image
                  src={userData.photoURL}
                  alt={userData.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {userData.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{userData.username}</h2>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                  Level {userData.level}
                </span>
                {userData.twoFactorEnabled && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500 font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    2FA
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-secondary/50">
          <button
            onClick={() => setActiveSection("avatar")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeSection === "avatar"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            Change Avatar
          </button>
          <button
            onClick={() => setActiveSection("2fa")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeSection === "2fa"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4" />
            Two-Factor Auth
          </button>
        </div>

        {/* Avatar Section */}
        {activeSection === "avatar" && (
          <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Change Your Avatar</h3>
              <p className="text-sm text-muted-foreground">
                Select a new avatar from our collection
              </p>
            </div>

            <AvatarSelector
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
            />

            <Button
              onClick={handleSaveAvatar}
              disabled={saving || selectedAvatar === userData.photoURL}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}

        {/* 2FA Section */}
        {activeSection === "2fa" && (
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-1">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Secure your account with an extra layer of protection
              </p>
            </div>

            <TwoFactorSetup
              userId={userData.uid}
              email={userData.email}
              isEnabled={userData.twoFactorEnabled}
              onComplete={handle2FAComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
