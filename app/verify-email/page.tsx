"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, MailCheck } from "lucide-react";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Confirming your email address...");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Invalid link. No verification token was provided.");
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

        if (res.ok && data.success) {
          setStatus("success");
          setMessage("Your email has been verified. Redirecting you to sign in...");
          setTimeout(() => router.push("/login"), 2500);
        } else {
          setStatus("error");
          setMessage(data.error || "We couldn't verify your email.");
        }
      } catch {
        setStatus("error");
        setMessage("A network error occurred. Please try again.");
      }
    })();
  }, [token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/5 bg-[#111827] p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <span className="text-2xl font-black italic tracking-tighter text-[#3B82F6]">
            MrCash
          </span>
        </div>

        <div className="flex flex-col items-center text-center">
          {status === "verifying" && (
            <>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#3B82F6]/10">
                <Loader2 className="h-10 w-10 animate-spin text-[#3B82F6]" />
              </div>
              <h1 className="text-xl font-bold text-white">Verifying your email</h1>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Email verified</h1>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Verification failed</h1>
            </>
          )}

          <p className="mt-3 text-sm leading-relaxed text-slate-400">{message}</p>

          {status === "error" && (
            <button
              onClick={() => router.push("/register")}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] py-4 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
            >
              <MailCheck className="h-5 w-5" />
              Back to Register
            </button>
          )}

          {status === "success" && (
            <button
              onClick={() => router.push("/login")}
              className="mt-8 w-full rounded-xl bg-white py-4 font-black text-black transition-colors hover:bg-gray-200"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </main>
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
