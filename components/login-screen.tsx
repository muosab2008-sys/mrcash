"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "@/lib/firebase";
import { Coins, Phone, Loader2 } from "lucide-react";
import type { ConfirmationResult } from "firebase/auth";

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"main" | "phone">("main");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSend = async () => {
    setLoading(true);
    setError("");
    try {
      const recaptcha = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptcha);
      setConfirmResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!confirmResult) return;
    setLoading(true);
    setError("");
    try {
      await confirmResult.confirm(otp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Coins className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Mr Cash</h1>
          <p className="text-muted-foreground text-sm">
            Complete offers. Earn points. Get paid.
          </p>
        </div>

        {mode === "main" ? (
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-card border border-border hover:border-primary/30 text-foreground rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-secondary disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
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
              Sign in with Google
            </button>

            <button
              onClick={() => setMode("phone")}
              className="w-full flex items-center justify-center gap-3 bg-card border border-border hover:border-primary/30 text-foreground rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-secondary"
            >
              <Phone className="h-5 w-5 text-accent" />
              Sign in with Phone
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!confirmResult ? (
              <>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  dir="ltr"
                />
                <button
                  onClick={handlePhoneSend}
                  disabled={loading || !phoneNumber}
                  className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleOtpVerify}
                  disabled={loading || !otp}
                  className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </button>
              </>
            )}
            <button
              onClick={() => {
                setMode("main");
                setConfirmResult(null);
                setError("");
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to sign in options
            </button>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
