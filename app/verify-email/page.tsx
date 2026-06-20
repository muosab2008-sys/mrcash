"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, AlertCircle, MailCheck } from "lucide-react";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Verifying your email address...");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please use the link from your email.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed. Please try again.");
          return;
        }

        setStatus("success");
        setMessage(data.message || "Your email has been verified successfully!");
        setTimeout(() => router.push("/login"), 2500);
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    })();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="MrCash" width={48} height={48} className="rounded-2xl" />
            <span className="text-2xl font-black bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent italic tracking-tighter">
              MrCash
            </span>
          </Link>
        </div>

        <div className="bg-[#1e293b] border border-white/5 rounded-2xl p-8 text-center">
          {status === "verifying" && (
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center mb-5">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Verifying Email</h1>
              <p className="text-sm text-slate-400">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-sm text-slate-400 mb-6">{message}</p>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <MailCheck className="h-4 w-4" />
                Redirecting you to sign in...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-sm text-slate-400 mb-6">{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold transition-opacity hover:opacity-90"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
