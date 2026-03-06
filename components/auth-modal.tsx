"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  DollarSign,
  X,
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  mode: "login" | "signup";
  setMode: (mode: "login" | "signup") => void;
}

export function AuthModal({ open, onClose, mode, setMode }: AuthModalProps) {
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Handle forgot password
    if (forgotMode) {
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        if (msg.includes("user-not-found")) {
          setError("No account found with this email.");
        } else if (msg.includes("invalid-email")) {
          setError("Please enter a valid email address.");
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      onClose();
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("email-already-in-use")) {
        setError("This email is already registered. Try logging in.");
      } else if (
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        setError("Incorrect email or password.");
      } else if (msg.includes("user-not-found")) {
        setError("No account found with this email.");
      } else if (msg.includes("weak-password")) {
        setError("Password should be at least 6 characters.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      onClose();
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("popup-closed-by-user")) {
        // User closed the popup, no error needed
      } else {
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setForgotMode(false);
    setResetSent(false);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setForgotMode(false);
    setResetSent(false);
  };

  const enterForgotMode = () => {
    setForgotMode(true);
    setError("");
    setResetSent(false);
  };

  const exitForgotMode = () => {
    setForgotMode(false);
    setError("");
    setResetSent(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center neon-glow mb-3">
            <DollarSign className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {forgotMode
              ? "Reset Password"
              : mode === "signup"
                ? "Create Account"
                : "Welcome Back"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {forgotMode
              ? "Enter your email to receive a reset link"
              : mode === "signup"
                ? "Sign up to start earning real cash"
                : "Log in to your account"}
          </p>
        </div>

        {/* Reset sent success */}
        {forgotMode && resetSent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Reset link sent!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Check your email{" "}
                <span className="text-primary font-medium">{email}</span> for a
                password reset link.
              </p>
            </div>
            <button
              onClick={exitForgotMode}
              className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-3 text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && !forgotMode && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
                  required
                />
              </div>

              {!forgotMode && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {/* Forgot password link */}
              {mode === "login" && !forgotMode && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={enterForgotMode}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 neon-glow"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : forgotMode ? (
                  "Send Reset Link"
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            {/* Divider */}
            {!forgotMode && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Google Sign-In */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>
              </>
            )}

            {/* Switch mode / Back to login */}
            <div className="mt-4 text-center">
              {forgotMode ? (
                <button
                  onClick={exitForgotMode}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to{" "}
                  <span className="text-primary font-medium">Log in</span>
                </button>
              ) : (
                <button
                  onClick={switchMode}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === "signup" ? (
                    <>
                      {"Already have an account? "}
                      <span className="text-primary font-medium">Log in</span>
                    </>
                  ) : (
                    <>
                      {"Don't have an account? "}
                      <span className="text-primary font-medium">Sign up</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
