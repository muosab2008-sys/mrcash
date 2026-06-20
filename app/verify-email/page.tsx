"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useRef, useState } from "react";
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
  const [message, setMessage] = useState("Confirming your account, hang tight...");
  const [countdown, setCountdown] = useState(4);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link. Please use the link from your email.");
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
          setMessage(data.error || "We couldn't verify your email.");
          return;
        }

        setStatus("success");
        setMessage(data.message || "Your email has been verified successfully.");
      } catch {
        setStatus("error");
        setMessage("A network error occurred. Please try again.");
      }
    })();
  }, [token]);

  // Graceful redirect to /login once verified.
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      router.push("/login");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, router]);

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

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#3B82F6]/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verifying your email</h1>
              <p className="text-sm text-white/50 leading-relaxed">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h1>
              <p className="text-sm text-white/50 leading-relaxed mb-6">{message}</p>
              <p className="text-xs text-white/30 mb-4">Redirecting to sign in in {countdown}s...</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold shadow-lg shadow-[#3B82F6]/20"
              >
                <MailCheck className="w-5 h-5" />
                Continue to Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
              <p className="text-sm text-white/50 leading-relaxed mb-6">{message}</p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full h-14 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/5 text-white font-medium transition-colors"
              >
                Back to Register
              </Link>
            </>
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
        <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
