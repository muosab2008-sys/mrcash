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
import { Trophy, Gift, Star, Lock, Check, Coins, Loader2, ShieldCheck, Globe } from "lucide-react";
import Link from "next/link";

const levels = Array.from({ length: 20 }, (_, i) => ({
  level: i + 1,
  threshold: (i + 1) * 10000,
  bonus: 1000, // $1 = 1000 points
}));

export default function LevelsPage() {
  const { userData, user } = useAuth();
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // --- التعديل: الحسبة الصحيحة والمزامنة مع السايدبار ---
  const pointsPerLevel = 10000;
  const totalEarned = userData?.totalEarned || 0;
  const currentLevel = Math.floor(totalEarned / pointsPerLevel) + 1;
  const pointsInCurrentLevel = totalEarned % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  // Load claimed levels from Firestore
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Level Progression</h1>
          <p className="text-muted-foreground">
            Level up to earn bonus rewards! Each level grants you a $1.00 bonus.
          </p>
        </div>
        
        {/* --- الشريط المضاف لسياسة الخصوصية والشروط --- */}
        <div className="flex items-center gap-2 bg-secondary/20 p-2 rounded-xl border border-white/5">
          <Link href="/privacy-policy" className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            PRIVACY
          </Link>
          <Link href="/terms-of-service" className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            TERMS
          </Link>
        </div>
      </div>

      {/* Current Level Card */}
      <Card className="border-[var(--brand-cyan)]/30 bg-gradient-to-br from-card to-[var(--brand-cyan)]/5 shadow-lg shadow-cyan-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl brand-gradient">
                <Trophy className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl brand-gradient-text font-black italic">Level {currentLevel}</CardTitle>
                <CardDescription>Your current level status</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground uppercase font-bold tracking-tighter">Total Earned</p>
              <p className="text-xl font-black text-[var(--brand-cyan)]">
                {totalEarned.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">pts</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Progress to Level {currentLevel + 1}</span>
              <span className="font-bold">
                {pointsInCurrentLevel.toLocaleString()} / {pointsPerLevel.toLocaleString()} pts
              </span>
            </div>
            {/* الشريط المصلح */}
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D2FF] to-[#A65FFF] transition-all duration-700 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                  style={{ width: `${levelProgress}%` }}
                />
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              {(pointsPerLevel - pointsInCurrentLevel).toLocaleString()} more points needed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Unclaimed Bonuses Alert */}
      {unclaimedBonuses.length > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-500">
                  {unclaimedBonuses.length} Unclaimed Bonuses!
                </p>
                <p className="text-sm text-muted-foreground">
                  You have ${unclaimedBonuses.length}.00 in unclaimed rewards
                </p>
              </div>
            </div>
            <Button
              onClick={claimAllBonuses}
              disabled={claiming !== null}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              {claiming === -1 ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Gift className="mr-2 h-4 w-4" />
              )}
              Claim All (${unclaimedBonuses.length}.00)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bonuses Earned */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Gift className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total Bonuses Claimed</p>
            <p className="text-2xl font-bold text-emerald-500">
              ${claimedLevels.length}.00
            </p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-0">
            {claimedLevels.length} of {currentLevel - 1} claimed
          </Badge>
        </CardContent>
      </Card>

      {/* Level Grid */}
      <div>
        <h2 className="mb-4 text-xl font-bold italic">All Levels</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {levels.map((level) => {
            const isCompleted = currentLevel > level.level;
            const isCurrent = currentLevel === level.level;
            const isLocked = currentLevel < level.level;
            const isClaimed = claimedLevels.includes(level.level);
            const canClaim = isCompleted && !isClaimed;

            return (
              <Card
                key={level.level}
                className={`border-border bg-card transition-all ${
                  isCurrent
                    ? "border-[var(--brand-cyan)] ring-1 ring-[var(--brand-cyan)]/20 shadow-lg shadow-cyan-500/5"
                    : isCompleted
                    ? "border-emerald-500/30"
                    : "opacity-60"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isCurrent
                            ? "brand-gradient shadow-md"
                            : isCompleted
                            ? "bg-emerald-500"
                            : "bg-muted"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5 text-white" />
                        ) : isLocked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Star className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold ${isCurrent ? "text-[var(--brand-cyan)]" : ""}`}>
                          Level {level.level}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {level.threshold.toLocaleString()} pts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Coins className={`h-3 w-3 ${isCompleted ? "text-emerald-500" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-black ${isCompleted ? "text-emerald-500" : "text-muted-foreground"}`}>
                          +$1.00
                        </span>
                      </div>
                      {canClaim ? (
                        <Button
                          size="sm"
                          onClick={() => claimLevelBonus(level.level)}
                          disabled={claiming !== null}
                          className="mt-1 h-7 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold"
                        >
                          {claiming === level.level ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </Button>
                      ) : isClaimed ? (
                        <Badge className="mt-1 bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">
                          Claimed
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="mt-3">
                      <Progress value={levelProgress} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
