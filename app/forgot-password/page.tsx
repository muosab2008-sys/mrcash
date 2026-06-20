"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("sent");
        setMessage(data.message || "If an account exists, a reset link has been sent.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("A network error occurred. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/5 bg-[#111827] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Forgot Password</h1>
          <p className="mt-2 text-sm font-medium text-slate-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {status === "sent" ? (
          <div className="animate-in fade-in zoom-in py-6 text-center duration-500">
            <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-emerald-400" />
            <p className="text-lg font-black text-white">Check your inbox</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
            <Link
              href="/login"
              className="mt-8 block w-full rounded-xl bg-white py-4 font-black text-black transition-colors hover:bg-gray-200"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === "error" && message && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm font-bold text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {message}
              </div>
            )}

            <div>
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Email
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-black py-4 pl-12 pr-4 text-white outline-none transition-all focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] py-4 font-black text-white shadow-[0_10px_20px_rgba(59,130,246,0.2)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
