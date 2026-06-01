"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowLeft, ArrowRight, KeyRound, Shield, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { AvatarSelector } from "@/components/avatar-selector";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  // Avatar selection state for Google users
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  
  const { login, loginWithGoogle, resetPassword, updateUserAvatar } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      
      // Check if user has 2FA enabled
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data()?.twoFactorEnabled) {
          // Sign out temporarily and show 2FA prompt
          setPendingUserId(currentUser.uid);
          await signOut(auth);
          setShow2FA(true);
          setLoading(false);
          return;
        }
      }
      
      toast.success("Welcome back!");
      router.push("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to login";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (twoFactorCode.length !== 6 || !pendingUserId) return;

    setVerifying2FA(true);
    try {
      const response = await fetch("/api/2fa/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pendingUserId,
          code: twoFactorCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.error || "Invalid verification code");
      }

      // 2FA verified, now complete the login
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid verification code";
      toast.error(message);
      setTwoFactorCode("");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      
      // Check if new user needs avatar selection
      if (result.isNewUser || result.needsAvatarSelection) {
        setShowAvatarSelection(true);
        setGoogleLoading(false);
        return;
      }
      
      // Check if user has 2FA enabled
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data()?.twoFactorEnabled) {
          setPendingUserId(currentUser.uid);
          await signOut(auth);
          setShow2FA(true);
          setGoogleLoading(false);
          return;
        }
      }
      
      toast.success("Welcome!");
      router.push("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to login with Google";
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      toast.error("Please select an avatar to continue");
      return;
    }

    setSavingAvatar(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateUserAvatar(selectedAvatar);
        // Remove the needsAvatarSelection flag
        await updateDoc(doc(db, "users", currentUser.uid), {
          needsAvatarSelection: false,
        });
        toast.success("Welcome to MrCash!");
        router.push("/");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save avatar";
      toast.error(message);
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setShowResetForm(false);
      setResetEmail("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleBack2FA = () => {
    setShow2FA(false);
    setTwoFactorCode("");
    setPendingUserId(null);
  };

  // Avatar Selection Form for Google users
  if (showAvatarSelection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="MrCash"
                width={48}
                height={48}
                className="rounded-2xl"
              />
              <span className="text-2xl font-black brand-gradient-text italic tracking-tighter">
                MrCash
              </span>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-emerald-500 text-white">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-foreground">Account</span>
            </div>
            <div className="w-8 h-[2px] bg-border" />
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                "brand-gradient text-white"
              )}>
                2
              </div>
              <span className="text-sm font-medium text-foreground">Avatar</span>
            </div>
          </div>

          {/* Avatar Card */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Choose Your Avatar</h1>
              <p className="text-sm text-muted-foreground">Pick a profile picture that represents you</p>
            </div>

            <AvatarSelector
              selectedAvatar={selectedAvatar}
              onSelect={setSelectedAvatar}
            />

            <Button
              type="button"
              onClick={handleSaveAvatar}
              className="w-full h-14 mt-6 rounded-2xl brand-gradient text-white font-bold shadow-lg glow-primary"
              disabled={savingAvatar || !selectedAvatar}
            >
              {savingAvatar ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2FA Verification Form
  if (show2FA) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="MrCash"
                width={48}
                height={48}
                className="rounded-2xl"
              />
              <span className="text-2xl font-black brand-gradient-text italic tracking-tighter">
                MrCash
              </span>
            </Link>
          </div>

          {/* 2FA Card */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Two-Factor Authentication</h1>
                <p className="text-sm text-muted-foreground">Enter your verification code</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app to continue signing in.
              </p>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(value) => setTwoFactorCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-11 h-14 text-lg bg-secondary/50 border-border text-foreground" />
                    <InputOTPSlot index={1} className="w-11 h-14 text-lg bg-secondary/50 border-border text-foreground" />
                    <InputOTPSlot index={2} className="w-11 h-14 text-lg bg-secondary/50 border-border text-foreground" />
                    <InputOTPSlot index={3} className="w-11 h-14 text-lg bg-secondary/50 border-border text-foreground" />
                    <InputOTPSlot index={4} className="w-11 h-14 text-lg bg-secondary/50 border-border text-foreground" />
                    <InputOTPSlot index={5} className="w-11 h-14 text-lg bg-secondary/50 border-border text-foreground" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="button"
                onClick={handle2FAVerification}
                className="w-full h-14 rounded-2xl brand-gradient text-white font-bold shadow-lg glow-primary"
                disabled={twoFactorCode.length !== 6 || verifying2FA}
              >
                {verifying2FA ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>

              <button
                type="button"
                onClick={handleBack2FA}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password Reset Form
  if (showResetForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="MrCash"
                width={48}
                height={48}
                className="rounded-2xl"
              />
              <span className="text-2xl font-black brand-gradient-text italic tracking-tighter">
                MrCash
              </span>
            </Link>
          </div>

          {/* Reset Card */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shrink-0">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Reset Password</h1>
                <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-secondary/30 border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl brand-gradient text-white font-bold shadow-lg glow-primary"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main Login Form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="MrCash"
              width={48}
              height={48}
              className="rounded-2xl"
            />
            <span className="text-2xl font-black brand-gradient-text italic tracking-tighter">
              MrCash
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your MrCash account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-secondary/30 border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-secondary/30 border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowResetForm(true)}
                className="text-sm text-primary hover:text-accent transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl brand-gradient text-white font-bold shadow-lg glow-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 rounded-2xl bg-secondary/30 border-border hover:bg-secondary hover:border-primary/30 text-foreground font-medium"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/register" className="text-primary hover:text-accent font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
