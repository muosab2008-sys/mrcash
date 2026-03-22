"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Gift, Star, Lock, Check, Coins } from "lucide-react";

const levels = Array.from({ length: 20 }, (_, i) => ({
  level: i + 1,
  threshold: (i + 1) * 10000,
  bonus: 1000, // $1 = 1000 points
}));

export default function LevelsPage() {
  const { userData } = useAuth();

  const currentLevel = userData?.level || 1;
  const totalEarned = userData?.totalEarned || 0;

  // Calculate current level progress
  const currentLevelThreshold = currentLevel * 10000;
  const previousLevelThreshold = (currentLevel - 1) * 10000;
  const pointsInCurrentLevel = totalEarned - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

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

      {/* Bonuses Earned */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
            <Gift className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Total Bonuses Earned</p>
            <p className="text-2xl font-bold text-emerald-500">
              ${((currentLevel - 1) * 1).toFixed(2)}
            </p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-0">
            {currentLevel - 1} levels completed
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
                      {isCompleted && (
                        <Badge className="mt-1 bg-emerald-500/10 text-emerald-500 border-0 text-xs">
                          Claimed
                        </Badge>
                      )}
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
              When you reach a new level, you automatically receive a $1.00 bonus (1,000 points).
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[var(--brand-cyan)]">3.</span>
              Your total earned points determine your level - keep completing offers to level up!
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
