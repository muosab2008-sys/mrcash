"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Trophy, 
  Gift, 
  Star, 
  Lock, 
  Check, 
  Coins, 
  Loader2, 
  ShieldCheck, 
  Globe, 
  Send,
  Zap,
  ChevronRight,
  Award
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const levels = Array.from({ length: 20 }, (_, i) => ({
  level: i + 1,
  threshold: (i + 1) * 10000,
  bonus: 1000, // $1.00 = 1000 points
}));

export default function LevelsPage() {
  const { userData, user } = useAuth();
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // --- الحسبة الدقيقة للمزامنة مع السايدبار ---
  const pointsPerLevel = 10000;
  const totalEarned = userData?.totalEarned || 0;
  const currentLevel = Math.floor(totalEarned / pointsPerLevel) + 1;
  const pointsInCurrentLevel = totalEarned % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  // تحميل البيانات من Firestore
  useEffect(() => {
    const loadClaimedLevels = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const claimedRef = doc(db, "users", user.uid, "rewards", "levels");
        const claimedSnap = await getDoc(claimedRef);
        
        if (claimedSnap.exists()) {
          setClaimedLevels(claimedSnap.data().claimed || []);
        }
      } catch (error) {
        console.error("Error loading claimed levels:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClaimedLevels();
  }, [user?.uid]);

  const claimLevelBonus = async (level: number) => {
    if (!user?.uid || !userData) return;
    
    if (claimedLevels.includes(level)) {
      toast.error("You have already claimed this level bonus");
      return;
    }

    if (currentLevel <= level) {
      toast.error("You haven't reached this level yet");
      return;
    }

    setClaiming(level);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: increment(1000),
      });

      const claimedRef = doc(db, "users", user.uid, "rewards", "levels");
      const claimedSnap = await getDoc(claimedRef);
      
      if (claimedSnap.exists()) {
        await updateDoc(claimedRef, {
          claimed: [...claimedLevels, level],
        });
      } else {
        await setDoc(claimedRef, {
          claimed: [level],
        });
      }

      setClaimedLevels([...claimedLevels, level]);
      toast.success(`Level ${level} bonus claimed! +1,000 points`);
    } catch (error: any) {
      toast.error(error.message || "Failed to claim bonus");
    } finally {
      setClaiming(null);
    }
  };

  const unclaimedBonuses = levels.filter(
    (l) => currentLevel > l.level && !claimedLevels.includes(l.level)
  );

  const claimAllBonuses = async () => {
    if (unclaimedBonuses.length === 0) return;
    
    setClaiming(-1); 
    try {
      const totalBonus = unclaimedBonuses.length * 1000;
      const levelsToClaim = unclaimedBonuses.map((l) => l.level);

      const userRef = doc(db, "users", user!.uid);
      await updateDoc(userRef, {
        points: increment(totalBonus),
      });

      const claimedRef = doc(db, "users", user!.uid, "rewards", "levels");
      const newClaimedLevels = [...claimedLevels, ...levelsToClaim];
      
      const claimedSnap = await getDoc(claimedRef);
      if (claimedSnap.exists()) {
        await updateDoc(claimedRef, { claimed: newClaimedLevels });
      } else {
        await setDoc(claimedRef, { claimed: newClaimedLevels });
      }

      setClaimedLevels(newClaimedLevels);
      toast.success(`Claimed ${unclaimedBonuses.length} bonuses!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to claim bonuses");
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-cyan)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Content Area */}
      <div className="flex-1 space-y-8 p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/5 p-8 sm:p-12">
          <div className="relative z-10">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1">
              REWARDS PROGRAM
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white mb-4">
              LEVEL <span className="brand-gradient-text text-glow">PROGRESSION</span>
            </h1>
            <p className="max-w-xl text-slate-400 text-sm sm:text-base leading-relaxed">
              Unlock the full potential of your earnings. Every level reached is a milestone toward exclusive bonuses and higher payouts.
            </p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Trophy size={200} className="text-white" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Level Card */}
          <Card className="md:col-span-2 border-[var(--brand-cyan)]/20 bg-[#080808] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-all" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl brand-gradient flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white/30 uppercase tracking-widest">Current Rank</p>
                    <CardTitle className="text-4xl font-black italic text-white leading-none">LEVEL {currentLevel}</CardTitle>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white/30 uppercase tracking-widest">Total Progress</p>
                  <p className="text-2xl font-black text-cyan-400">{totalEarned.toLocaleString()} <span className="text-[10px] text-slate-500">PTS</span></p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>To Level {currentLevel + 1}</span>
                  <span>{pointsInCurrentLevel.toLocaleString()} / {pointsPerLevel.toLocaleString()}</span>
                </div>
                {/* Progress Bar المصلح */}
                <div className="h-4 w-full bg-white/5 rounded-full p-1 border border-white/5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                  <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  {(pointsPerLevel - pointsInCurrentLevel).toLocaleString()} points remaining for next bonus
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="bg-[#080808] border-white/5 flex flex-col justify-between">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">Total Bonuses</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0">${claimedLevels.length}.00</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">Claimed Rewards</span>
                  <span className="text-lg font-black text-white">{claimedLevels.length} <span className="text-xs text-slate-600">/ {currentLevel - 1}</span></span>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
               {unclaimedBonuses.length > 0 && (
                <Button 
                  onClick={claimAllBonuses}
                  disabled={claiming !== null}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  {claiming === -1 ? <Loader2 className="animate-spin" /> : <Gift className="mr-2 h-5 w-5" />}
                  Claim All (${unclaimedBonuses.length}.00)
                </Button>
               )}
            </div>
          </Card>
        </div>

        {/* Level Grid Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-cyan-500 rounded-full" />
            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Roadmap to Success</h2>
          </div>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {levels.map((level) => {
              const isCompleted = currentLevel > level.level;
              const isCurrent = currentLevel === level.level;
              const isLocked = currentLevel < level.level;
              const isClaimed = claimedLevels.includes(level.level);
              const canClaim = isCompleted && !isClaimed;

              return (
                <div 
                  key={level.level}
                  className={cn(
                    "relative group rounded-2xl border p-5 transition-all duration-300",
                    isCurrent 
                      ? "bg-[#111] border-cyan-500/50 shadow-lg shadow-cyan-500/5 scale-[1.02] z-10" 
                      : isCompleted 
                      ? "bg-[#080808] border-emerald-500/20" 
                      : "bg-[#050505] border-white/5 opacity-50 hover:opacity-100"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center border transition-colors",
                      isCompleted ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                      isCurrent ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                      "bg-white/5 border-white/5 text-slate-700"
                    )}>
                      {isCompleted ? <Check size={20} strokeWidth={3} /> : <Star size={20} />}
                    </div>
                    <div className="text-right">
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-widest",
                         isCompleted ? "text-emerald-500" : isCurrent ? "text-cyan-400" : "text-slate-700"
                       )}>
                         {isLocked ? "Locked" : isCurrent ? "Active" : "Done"}
                       </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white italic">LVL {level.level}</h3>
                  <div className="flex items-center gap-1.5 mb-5">
                    <Coins size={12} className="text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-500">{level.threshold.toLocaleString()} PTS</span>
                  </div>

                  {canClaim ? (
                    <Button 
                      onClick={() => claimLevelBonus(level.level)}
                      disabled={claiming !== null}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 h-8 text-[10px] font-black uppercase tracking-tighter"
                    >
                      {claiming === level.level ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim $1.00"}
                    </Button>
                  ) : isClaimed ? (
                    <div className="w-full py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                       <span className="text-[10px] font-black text-emerald-500 uppercase">Reward Collected</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="w-full space-y-2">
                       <Progress value={levelProgress} className="h-1" />
                       <p className="text-[9px] text-center text-cyan-400 font-bold uppercase">{Math.floor(levelProgress)}% Complete</p>
                    </div>
                  ) : (
                    <div className="w-full py-1.5 text-center">
                       <span className="text-[10px] font-black text-slate-800 uppercase">+$1.00 Reward</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- Footer المصلح والكامل العرض --- */}
      <footer className="mt-20 border-t border-white/5 bg-[#080808]/80 pt-16 pb-12 w-full px-4 sm:px-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={38} height={38} className="rounded-xl" />
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent italic tracking-tighter">
                MrCash
              </span>
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed font-medium max-w-[280px]">
              The premier destination for turning digital tasks into real-world rewards securely and instantly.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em]">Security & Trust</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[12px] text-slate-400 group cursor-default">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                AES-256 Encryption
              </div>
              <div className="flex items-center gap-3 text-[12px] text-slate-400 group cursor-default">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all">
                  <Globe className="w-4 h-4 text-cyan-500" />
                </div>
                Global Infrastructure
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em]">Legal & Links</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/privacy-policy" className="text-[12px] text-slate-500 hover:text-white transition-all flex items-center gap-2">
                <ChevronRight size={12} className="text-cyan-500" /> Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-[12px] text-slate-500 hover:text-white transition-all flex items-center gap-2">
                <ChevronRight size={12} className="text-cyan-500" /> Terms of Service
              </Link>
              <Link href="/about" className="text-[12px] text-slate-500 hover:text-white transition-all flex items-center gap-2">
                <ChevronRight size={12} className="text-cyan-500" /> About Platform
              </Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em]">Join Community</h4>
            <a 
              href="https://t.me/+HaIWYiOHx-FkNzY0" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-4 p-5 rounded-2xl bg-black border border-white/5 hover:border-cyan-500/30 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Send size={40} className="text-white" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#0088cc] group-hover:border-[#0088cc] transition-all">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-white uppercase tracking-tighter">Telegram</span>
                <span className="text-[10px] text-slate-600 font-bold group-hover:text-white/70 transition-colors">Join Channel</span>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-slate-700 tracking-[0.8em] uppercase">
            © 2026 MR.CASH • DESIGNED FOR THE FUTURE • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}
