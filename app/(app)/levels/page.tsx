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
import { Trophy, Gift, Star, Lock, Check, Coins, Loader2 } from "lucide-react";

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

  const currentLevel = userData?.level || 1;
  const totalEarned = userData?.totalEarned || 0;

  // Calculate current level progress
  const currentLevelThreshold = currentLevel * 10000;
  const previousLevelThreshold = (currentLevel - 1) * 10000;
  const pointsInCurrentLevel = totalEarned - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

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
    
    // Check if already claimed
    if (claimedLevels.includes(level)) {
      toast.error("You have already claimed this level bonus");
      return;
    }

    // Check if level is actually completed
    if (currentLevel <= level) {
      toast.error("You haven't reached this level yet");
      return;
    }

    setClaiming(level);
    try {
      // Update user points
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: increment(1000), // $1 = 1000 points
      });

      // Record claimed level
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
      toast.success(`Level ${level} bonus claimed! +$1.00 (1,000 points)`);
    } catch (error: any) {
      toast.error(error.message || "Failed to claim bonus");
    } finally {
      setClaiming(null);
    }
  };

  // Calculate unclaimed bonuses
  const unclaimedBonuses = levels.filter(
    (l) => currentLevel > l.level && !claimedLevels.includes(l.level)
  );

  const claimAllBonuses = async () => {
    if (unclaimedBonuses.length === 0) return;
    
    setClaiming(-1); // Use -1 to indicate claiming all
    try {
      const totalBonus = unclaimedBonuses.length * 1000;
      const levelsToClaim = unclaimedBonuses.map((l) => l.level);

      // Update user points
      const userRef = doc(db, "users", user!.uid);
      await updateDoc(userRef, {
        points: increment(totalBonus),
      });

      // Record all claimed levels
      const claimedRef = doc(db, "users", user!.uid, "rewards", "levels");
      const newClaimedLevels = [...claimedLevels, ...levelsToClaim];
      
      const claimedSnap = await getDoc(claimedRef);
      if (claimedSnap.exists()) {
        await updateDoc(claimedRef, { claimed: newClaimedLevels });
      } else {
        await setDoc(claimedRef, { claimed: newClaimedLevels });
      }

      setClaimedLevels(newClaimedLevels);
      toast.success(`Claimed ${unclaimedBonuses.length} bonuses! +$${unclaimedBonuses.length}.00`);
    } catch (error: any) {
      toast.error(error.message || "Failed to claim bonuses");
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Level Progression</h1>
        <p className="text-muted-foreground">
          Level up to earn bonus rewards! Each level grants you a $1.00 bonus.
        </p>
      </div>

      {/* Current Level Card */}
      <Card className="border-[var(--brand-cyan)]/30 bg-gradient-to-br from-card to-[var(--brand-cyan)]/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl brand-gradient">
                <Trophy className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl brand-gradient-text">Level {currentLevel}</CardTitle>
                <CardDescription>Your current level</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-xl font-bold text-[var(--brand-cyan)]">
                {totalEarned.toLocaleString()} pts
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to Level {currentLevel + 1}</span>
              <span className="font-medium">
                {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevel.toLocaleString()} pts
              </span>
            </div>
            <Progress value={levelProgress} className="h-4" />
            <p className="text-sm text-muted-foreground">
              {(pointsNeededForLevel - pointsInCurrentLevel).toLocaleString()} more points needed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Unclaimed Bonuses Alert */}
      {unclaimedBonuses.length > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-500">
                  {unclaimedBonuses.length} Unclaimed Bonuses!
                </p>
                <p className="text-sm text-muted-foreground">
                  You have ${unclaimedBonuses.length}.00 in unclaimed level bonuses
                </p>
              </div>
            </div>
            <Button
              onClick={claimAllBonuses}
              disabled={claiming !== null}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
            <Gift className="h-6 w-6 text-primary-foreground" />
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
        <h2 className="mb-4 text-xl font-bold">All Levels</h2>
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
                    ? "border-[var(--brand-cyan)] ring-2 ring-[var(--brand-cyan)]/20"
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
                            ? "brand-gradient"
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
                          <Star className="h-5 w-5 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold ${isCurrent ? "text-[var(--brand-cyan)]" : ""}`}>
                          Level {level.level}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {level.threshold.toLocaleString()} pts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Coins className={`h-4 w-4 ${isCompleted ? "text-emerald-500" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-bold ${isCompleted ? "text-emerald-500" : "text-muted-foreground"}`}>
                          +$1.00
                        </span>
                      </div>
                      {canClaim ? (
                        <Button
                          size="sm"
                          onClick={() => claimLevelBonus(level.level)}
                          disabled={claiming !== null}
                          className="mt-1 h-7 bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
                        >
                          {claiming === level.level ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </Button>
                      ) : isClaimed ? (
                        <Badge className="mt-1 bg-emerald-500/10 text-emerald-500 border-0 text-xs">
                          Claimed
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="mt-3">
                      <Progress value={levelProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[var(--brand-purple)]" />
            Level Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">1.</span>
              Each level requires 10,000 additional points.
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">2.</span>
              When you reach a new level, you can claim a $1.00 bonus (1,000 points).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">3.</span>
              Click the "Claim" button on completed levels to receive your bonus!
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
