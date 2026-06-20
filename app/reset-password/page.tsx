"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// English letters, numbers and common symbols only.
const PASSWORD_RE = /^[A-Za-z0-9!@#$%^&*()_\-+=]{6,}$/;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("This link is invalid or has already been used.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }
    if (!PASSWORD_RE.test(password)) {
      setErrorMessage("Password must be at least 6 English letters, numbers, or symbols.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to update password. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("A network error occurred. Please try again.");
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-[2rem] border border-white/5 bg-[#111827] p-8 shadow-2xl">
        <div className="animate-in fade-in zoom-in py-6 text-center duration-500">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <p className="text-xl font-black text-white">Invalid Link</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            This reset link is missing or invalid. Please request a new one.
          </p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="mt-8 w-full rounded-xl bg-white py-4 font-black text-black transition-colors hover:bg-gray-200"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/5 bg-[#111827] p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">Reset Password</h1>
        <p className="mt-2 text-sm font-medium text-slate-400">Enter your new password</p>
      </div>

      {status === "success" ? (
        <div className="animate-in fade-in zoom-in py-6 text-center duration-500">
          <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-emerald-400" />
          <p className="text-xl font-black text-white">Success!</p>
          <p className="mt-2 text-sm text-slate-400">
            Your password has been updated. Redirecting to login...
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-8 w-full rounded-xl bg-white py-4 font-black text-black transition-colors hover:bg-gray-200"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm font-bold text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {errorMessage}
            </div>
          )}

          <div>
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              New Password
            </label>
            <input
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition-all focus:border-[#3B82F6]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Confirm Password
            </label>
            <input
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none transition-all focus:border-[#8B5CF6]"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            disabled={status === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] py-4 font-black text-white shadow-[0_10px_20px_rgba(59,130,246,0.2)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
      <Suspense fallback={<div className="animate-pulse font-bold text-white">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
