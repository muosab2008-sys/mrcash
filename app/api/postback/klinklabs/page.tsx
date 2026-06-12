"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "valid" | "expired" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Verify reset code on mount
  useEffect(() => {
    async function verifyCode() {
      if (!oobCode) {
        setStatus("expired");
        setErrorMessage("This link has expired or has already been used.");
        return;
      }

      try {
        // Check if code was already used (burned)
        const resetDocRef = doc(db, "passwordResets", oobCode);
        const resetDoc = await getDoc(resetDocRef);
        
        if (resetDoc.exists()) {
          const data = resetDoc.data();
          
          // Check if already used
          if (data.used) {
            setStatus("expired");
            setErrorMessage("This link has expired or has already been used.");
            return;
          }
          
          // Check if expired (10 minutes)
          const createdAt = data.createdAt as Timestamp;
          const expiresAt = createdAt.toMillis() + (10 * 60 * 1000); // 10 minutes
          
          if (Date.now() > expiresAt) {
            setStatus("expired");
            setErrorMessage("This link has expired or has already been used.");
            return;
          }
        }
        
        // Verify with Firebase Auth
        await verifyPasswordResetCode(auth, oobCode);
        
        // If this is a new code, track it
        if (!resetDoc.exists()) {
          await setDoc(resetDocRef, {
            createdAt: serverTimestamp(),
            used: false
          });
        }
        
        setStatus("valid");
      } catch {
        setStatus("expired");
        setErrorMessage("This link has expired or has already been used.");
      }
    }

    verifyCode();
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (!oobCode) {
      setErrorMessage("This link has expired or has already been used.");
      return;
    }

    setStatus("loading");

    try {
      // Reset password in Firebase
      await confirmPasswordReset(auth, oobCode, password);
      
      // Burn the reset code (mark as used)
      const resetDocRef = doc(db, "passwordResets", oobCode);
      await setDoc(resetDocRef, { used: true }, { merge: true });
      
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Failed to update password. Please try again.");
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-full max-w-md bg-[#121214] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-gray-400 text-sm font-medium">Verifying link...</p>
        </div>
      </div>
    );
  }

  // Expired/Invalid state
  if (status === "expired") {
    return (
      <div className="w-full max-w-md bg-[#121214] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
        <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-xl font-black text-white mb-2">Invalid Link</p>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">{errorMessage}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-8 w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-[#121214] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Reset Password</h1>
        <p className="text-gray-400 text-sm mt-2 font-medium">Enter your new password</p>
      </div>

      {status === "success" ? (
        <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-black text-white">Success!</p>
          <p className="text-gray-400 text-sm mt-2">Your password has been updated.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-8 w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {errorMessage}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
            <input
              type="password"
              required
              className="w-full mt-2 bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-[#3B82F6] transition-all outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full mt-2 bg-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-[#8B5CF6] transition-all outline-none"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            disabled={status === "loading"}
            className="w-full py-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-black rounded-xl shadow-[0_10px_20px_rgba(59,130,246,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {status === "loading" ? "Processing..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white font-bold animate-pulse">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
