"use client";

// Force rebuild
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft, Maximize2, ThumbsUp, ThumbsDown, Flame, Trophy, TrendingUp, Sparkles, Zap } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Helper function to convert points to USD (1000 points = $1)
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

interface Offerwall { 
  id: string; 
  name: string; 
  description: string; 
  logoUrl: string; 
  avgPoints: number; 
  isActive: boolean; 
  url: string; 
  color: string;
  likes?: number;
  dislikes?: number;
  isHot?: boolean;
}

const defaultOfferwalls: Offerwall[] = [
  { id: "playtime", name: "PlayTimeSdk", description: "Play games and complete tasks to earn high rewards", logoUrl: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp", avgPoints: 1200, isActive: true, url: "#", color: "#9333ea", likes: 25, dislikes: 10, isHot: true },
  { id: "pubscale", name: "PubScale", description: "Discover new apps and complete quick offers", logoUrl: "https://cashlyearn.com/storage/providers/oEfGzXHjrQMaKUZCf1uiT5tv4xvDSwVqsXsZccSl.webp", avgPoints: 850, isActive: true, url: "#", color: "#2563eb", likes: 18, dislikes: 5, isHot: false },
  { id: "gemiad", name: "GemiAd", description: "Access the highest paying tasks and complete instant surveys", logoUrl: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png", avgPoints: 1500, isActive: true, url: "#", color: "#ff5722", likes: 32, dislikes: 8, isHot: true },
  { id: "revtoo", name: "Revtoo", description: "Maximize your earnings with high-reward premium offers", logoUrl: "https://revtoo.com/assets/offerwall/images/revtoo-dark.svg", avgPoints: 1800, isActive: true, url: "#", color: "#0ea5e9", likes: 45, dislikes: 12, isHot: true },
  { id: "offery", name: "Offery", description: "Maximize your earnings with instant, verified surveys", logoUrl: "https://earng.net/storage/providers/x5v40jKJIoMPSNXMmiyTkK0eWIGXHPXSsAT2QRYb.png", avgPoints: 1600, isActive: true, url: "#", color: "#ffc107", likes: 28, dislikes: 6, isHot: false },
  { id: "adtogame", name: "AdToGame", description: "Unlock exclusive high-payout opportunities", logoUrl: "https://earng.net/storage/providers/GtCTDFNK8p1W2yfdiBtF9khJjbw6zN9FztVJQdii.svg", avgPoints: 2200, isActive: true, url: "#", color: "#25D3C2", likes: 52, dislikes: 15, isHot: true },
  { id: "pixylabs", name: "PixyLabs", description: "Complete high-paying offers and tasks from PixyLabs", logoUrl: "https://earng.net/storage/providers/79LyQwnqcRHoZsaEdiDmzoFQK5S2VOOIRUtwQ3LU.png", avgPoints: 2000, isActive: true, url: "#", color: "#6366f1", likes: 38, dislikes: 9, isHot: false },
  { id: "adlexy", name: "Adlexy", description: "Complete premium offers and earn instant rewards with Adlexy", logoUrl: "https://bagiracash.com/assets/images/networks/690680a83ff6d.webp", avgPoints: 1900, isActive: true, url: "#", color: "#3b82f6", likes: 22, dislikes: 7, isHot: false },
  { id: "taskwall", name: "TaskWall", description: "Complete premium tasks and high-paying offers with TaskWall", logoUrl: "http://publishers.taskwall.io//manager/uploads/logo-2.png", avgPoints: 2100, isActive: true, url: "#", color: "#10b981", likes: 41, dislikes: 11, isHot: true },
  { id: "wannads", name: "Wannads", description: "Complete high-paying surveys and exclusive offers with Wannads", logoUrl: "https://affi-plat.s3.us-east-2.amazonaws.com/platforms/wannads-ogotipo-naranja.png", avgPoints: 2500, isActive: true, url: "#", color: "#ff4757", likes: 55, dislikes: 14, isHot: true },
  { id: "bagirawall", name: "BagiraWall", description: "Unlock exclusive high-payout offers and premium tasks with BagiraWall", logoUrl: "https://bagiracash.com/assets/images/networks/698b5555a836d.png", avgPoints: 2300, isActive: true, url: "#", color: "#f59e0b", likes: 35, dislikes: 8, isHot: false },
  { id: "flexwall", name: "Flex Wall", description: "Complete high-paying offers and premium tasks with Flex Wall", logoUrl: "https://media.licdn.com/dms/image/v2/D4D0BAQGjjGNPMg4b5A/company-logo_200_200/B4DZdj2GDwHAAM-/0/1749726817858/flex_wall_logo?e=2147483647&v=beta&t=FX9Rns8aGV87i0C6XdTSsPag5BpWgXrfFnK38vzM4ts", avgPoints: 2200, isActive: true, url: "#", color: "#6366f1", likes: 29, dislikes: 6, isHot: false },
];

interface VoteData {
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
}

export default function EarnPage() {
  const { userData } = useAuth();
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>(defaultOfferwalls);
  const [loading, setLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState<{url: string, title: string} | null>(null);
  const [votes, setVotes] = useState<Record<string, VoteData>>({});
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "offerwalls"), orderBy("avgPoints", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const walls = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Offerwall[];
        setOfferwalls(walls.filter((w) => w.isActive));
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    defaultOfferwalls.forEach((wall) => {
      const docRef = doc(db, "offerwalls", wall.id);
      
      const unsubscribe = onSnapshot(docRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          let userVote: "like" | "dislike" | null = null;
          
          if (userData?.uid) {
            const userVoteRef = doc(db, "offerwalls", wall.id, "votes", userData.uid);
            const userVoteSnap = await getDoc(userVoteRef);
            if (userVoteSnap.exists()) {
              userVote = userVoteSnap.data().type;
            }
          }
          
          setVotes((prev) => ({
            ...prev,
            [wall.id]: {
              likes: data.likes || 0,
              dislikes: data.dislikes || 0,
              userVote,
            },
          }));
        }
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [userData?.uid]);

  const handleVote = async (wallId: string, voteType: "like" | "dislike", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userData?.uid || votingId) return;
    
    setVotingId(wallId);
    
    const currentVote = votes[wallId] || { likes: 0, dislikes: 0, userVote: null };
    const newVotes = { ...votes };
    
    if (currentVote.userVote === voteType) {
      newVotes[wallId] = {
        ...currentVote,
        [voteType === "like" ? "likes" : "dislikes"]: Math.max(0, currentVote[voteType === "like" ? "likes" : "dislikes"] - 1),
        userVote: null,
      };
    } else if (currentVote.userVote) {
      newVotes[wallId] = {
        likes: voteType === "like" ? currentVote.likes + 1 : Math.max(0, currentVote.likes - 1),
        dislikes: voteType === "dislike" ? currentVote.dislikes + 1 : Math.max(0, currentVote.dislikes - 1),
        userVote: voteType,
      };
    } else {
      newVotes[wallId] = {
        ...currentVote,
        [voteType === "like" ? "likes" : "dislikes"]: currentVote[voteType === "like" ? "likes" : "dislikes"] + 1,
        userVote: voteType,
      };
    }
    setVotes(newVotes);
    
    try {
      const offerRef = doc(db, "offerwalls", wallId);
      const userVoteRef = doc(db, "offerwalls", wallId, "votes", userData.uid);
      
      const offerSnap = await getDoc(offerRef);
      const userVoteSnap = await getDoc(userVoteRef);
      
      if (!offerSnap.exists()) {
        await setDoc(offerRef, {
          likes: voteType === "like" ? 1 : 0,
          dislikes: voteType === "dislike" ? 1 : 0,
        });
        await setDoc(userVoteRef, { type: voteType, timestamp: new Date() });
      } else if (!userVoteSnap.exists()) {
        await updateDoc(offerRef, {
          [voteType === "like" ? "likes" : "dislikes"]: increment(1),
        });
        await setDoc(userVoteRef, { type: voteType, timestamp: new Date() });
      } else {
        const existingVote = userVoteSnap.data().type;
        
        if (existingVote === voteType) {
          await updateDoc(offerRef, {
            [voteType === "like" ? "likes" : "dislikes"]: increment(-1),
          });
          await setDoc(userVoteRef, { type: null, timestamp: new Date() });
        } else {
          await updateDoc(offerRef, {
            [existingVote === "like" ? "likes" : "dislikes"]: increment(-1),
            [voteType === "like" ? "likes" : "dislikes"]: increment(1),
          });
          await setDoc(userVoteRef, { type: voteType, timestamp: new Date() });
        }
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVotingId(null);
    }
  };

  const getDynamicUrl = (wall: Offerwall) => {
    if (!userData?.uid) return "#";
    const uid = userData.uid;
    const urls: Record<string, string> = {
      playtime: `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,
      pubscale: `https://wow.pubscale.com?app_id=99429038&user_id=${uid}`,
      gemiad: `https://gemiwall.com/69c1622e82a1cd59c17a2e21/${uid}`,
      revtoo: `https://revtoo.com/offerwall/xol9xws01wsarkpuv7miwdair6ikvu/${uid}`,
      offery: `https://offery.io/offerwall/c9dow9gf6dwikkp48nnlxxynr24ng6/${uid}`,
      adtogame: `https://adtowall.com/7683/${uid}`,
      pixylabs: `https://offerwall.pixylabs.co/230?uid=${uid}`,
      adlexy: `https://adlexy.com/offerwall/7czsknu4bdnqutvkilmntorwwr0s2s/${uid}`,
      taskwall: `https://wall.taskwall.io/?app_id=e723adebdbab293255deefe5fe401b43&userid=${uid}`,
      wannads: `https://earn.wannads.com/wall?apiKey=69c2b3a37bb68663049007&userId=${uid}`,
      bagirawall: `https://bagirawall.com/offerwall/20/${uid}`,
      flexwall: `https://flexwall.net/iframe?app_id=412&user_id=${uid}`,
    };
    return urls[wall.id] || wall.url;
  };

  const pointsPerLevel = 10000;
  const currentLevel = Math.floor((userData?.totalEarned || 0) / pointsPerLevel) + 1;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  const getLikePercentage = (likes: number = 0, dislikes: number = 0) => {
    const total = likes + dislikes;
    if (total === 0) return 50;
    return (likes / total) * 100;
  };

  if (activeOffer) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-card/90 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-foreground rounded-xl hover:bg-secondary shrink-0 h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-bold text-foreground text-sm truncate">{activeOffer.title}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => window.open(activeOffer.url, '_blank')} className="text-muted-foreground rounded-xl hover:bg-secondary h-9 w-9">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setActiveOffer(null)} className="text-muted-foreground rounded-xl hover:bg-secondary h-9 w-9">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <iframe src={activeOffer.url} className="w-full flex-1 border-0" title={activeOffer.title} allow="autoplay; fullscreen" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6"> 
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/20 p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl brand-gradient flex items-center justify-center shadow-lg glow-primary shrink-0">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground">
                Welcome{userData?.username ? `, ${userData.username}` : ""}!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Complete tasks and earn real rewards</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs font-bold">
              <Zap className="w-3 h-3 mr-1" />
              {offerwalls.length} Active Offers
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/30 transition-all">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-secondary border border-border shrink-0">
              <Image src="/coin.png" alt="Points" width={24} height={24} className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">Balance</p>
              <p className="text-lg sm:text-2xl font-black text-foreground truncate">{(userData?.points ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-primary font-medium">= ${pointsToUSD(userData?.points ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Level Card */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-amber-500/30 transition-all">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Level</p>
              <p className="text-lg sm:text-2xl font-black text-amber-500">{currentLevel}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Earned Card */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/30 transition-all">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl brand-gradient shadow-lg glow-primary shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">Total Earned</p>
              <p className="text-lg sm:text-2xl font-black text-primary truncate">{(userData?.totalEarned || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Level Progress Card - Hidden on mobile, visible on desktop */}
        <Card className="hidden lg:block bg-gradient-to-br from-card to-card/50 border-border/50">
          <CardContent className="p-4 h-full flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">Level Progress</p>
              <p className="text-xs font-bold text-foreground">{Math.floor(levelProgress)}%</p>
            </div>
            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
              <div className="h-full brand-gradient transition-all duration-500 rounded-full" style={{ width: `${levelProgress}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {pointsInCurrentLevel.toLocaleString()} / {pointsPerLevel.toLocaleString()} MC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress - Mobile only */}
      <Card className="lg:hidden bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-foreground">Level {currentLevel}</span>
            </div>
            <span className="text-xs text-muted-foreground">{pointsInCurrentLevel.toLocaleString()} / {pointsPerLevel.toLocaleString()}</span>
          </div>
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border">
            <div className="h-full brand-gradient transition-all duration-500 rounded-full" style={{ width: `${levelProgress}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Offerwalls Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">Earn MC</h2>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
            {offerwalls.length} Available
          </Badge>
        </div>
        
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? ( 
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border/50 p-4 animate-pulse">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary" />
                  <div className="h-4 w-20 bg-secondary rounded" />
                  <div className="h-2 w-full bg-secondary rounded" />
                </div>
              </Card>
            ))
          ) : (
            offerwalls.map((wall) => {
              const wallVotes = votes[wall.id] || { likes: wall.likes || 0, dislikes: wall.dislikes || 0, userVote: null };
              const isVoting = votingId === wall.id;
              
              return (
                <Card 
                  key={wall.id} 
                  onClick={() => { const url = getDynamicUrl(wall); if (url !== "#") setActiveOffer({ url, title: wall.name }); }}
                  className="relative bg-gradient-to-br from-card to-card/50 border-border/50 p-3 sm:p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
                >
                  {/* Hot Badge */}
                  {wall.isHot && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <Badge className="bg-orange-500/20 text-orange-500 border border-orange-500/30 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Flame className="h-2.5 w-2.5" />
                        <span className="hidden sm:inline">Hot</span>
                      </Badge>
                    </div>
                  )}

                  {/* Logo and Name */}
                  <div className="flex flex-col items-center gap-3 mb-3">
                    <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-secondary p-2 border border-border group-hover:border-primary/30 transition-all">
                      <img src={wall.logoUrl} alt={wall.name} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="font-bold text-foreground text-xs sm:text-sm text-center line-clamp-1">{wall.name}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${getLikePercentage(wallVotes.likes, wallVotes.dislikes)}%` }}
                      />
                      <div 
                        className="h-full bg-destructive/50" 
                        style={{ width: `${100 - getLikePercentage(wallVotes.likes, wallVotes.dislikes)}%` }}
                      />
                    </div>
                  </div>

                  {/* Like/Dislike Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      disabled={!userData?.uid || isVoting}
                      onClick={(e) => handleVote(wall.id, "like", e)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-all text-xs ${
                        wallVotes.userVote === "like"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-secondary text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent"
                      } ${isVoting ? "opacity-50" : ""}`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span className="font-medium">{wallVotes.likes}</span>
                    </button>
                    <button
                      disabled={!userData?.uid || isVoting}
                      onClick={(e) => handleVote(wall.id, "dislike", e)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-all text-xs ${
                        wallVotes.userVote === "dislike"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-secondary text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent"
                      } ${isVoting ? "opacity-50" : ""}`}
                    >
                      <ThumbsDown className="h-3 w-3" />
                      <span className="font-medium">{wallVotes.dislikes}</span>
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
