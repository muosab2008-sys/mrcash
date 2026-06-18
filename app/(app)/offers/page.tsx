"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  ExternalLink, 
  Search, 
  LayoutGrid, 
  List, 
  ThumbsUp, 
  ThumbsDown, 
  Loader2, 
  TrendingUp,
  Info,
  CheckCircle2
} from "lucide-react";

interface Offer {
  id: string;
  name: string;
  description: string;
  provider: string;
  payout: number;
  mcPoints: number;
  image?: string;
  url: string;
  steps?: string[];
  requirements?: string;
}

interface OfferVotes {
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
}

export default function OffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("points-high");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [votes, setVotes] = useState<Record<string, OfferVotes>>({});
  const [votingOfferId, setVotingOfferId] = useState<string | null>(null);

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    async function fetchOffersDirectly() {
      setLoading(true);
      try {
        const currentUid = user ? user.uid : "demo-user-1";
        let allCampaigns: any[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore && currentPage <= 10) {
          const notikUrl = new URL("https://notik.me/api/v1/live-campaigns-for-user");
          notikUrl.searchParams.append("api_key", "NofGnODVnHB3werypR5PRKx5ew8fTbB4");
          notikUrl.searchParams.append("pub_id", "Yog41D");
          notikUrl.searchParams.append("app_id", "psPQDvAS3y");
          notikUrl.searchParams.append("user_id", currentUid);
          notikUrl.searchParams.append("duration", "30d");
          notikUrl.searchParams.append("limit", "100"); 
          notikUrl.searchParams.append("page", String(currentPage));

          const response = await fetch(notikUrl.toString());
          
          if (!response.ok) break;

          const result = await response.json();
          const campaigns = result.campaigns || result.data || [];
          
          if (Array.isArray(campaigns) && campaigns.length > 0) {
            allCampaigns = [...allCampaigns, ...campaigns];
            
            if (campaigns.length < 20) {
              hasMore = false;
            } else {
              currentPage++;
            }
          } else {
            hasMore = false;
          }
        }

        if (allCampaigns.length > 0) {
          const formattedOffers = allCampaigns.map((campaign: any) => {
            let extractedSteps: string[] = [];
            if (campaign.steps) {
              extractedSteps = Array.isArray(campaign.steps) ? campaign.steps : [campaign.steps];
            } else if (campaign.action) {
              extractedSteps = [campaign.action];
            }

            const realPayout = Number(campaign.payout) || 0;
            const customPoints = Number(campaign.payout_custom);
            const finalPoints = customPoints > 0 && customPoints < 1000000 
                ? customPoints 
                : Math.round(realPayout * 1000);

            return {
              id: String(campaign.id || campaign.campaign_id),
              name: campaign.name || campaign.title,
              description: campaign.description || campaign.action || "Complete this offer to earn MC",
              provider: "Notik",
              payout: realPayout,
              mcPoints: finalPoints || Number(campaign.points) || 0,
              image: campaign.image_url || campaign.icon_url || "/placeholder.svg",
              url: campaign.url || campaign.click_url,
              steps: extractedSteps.length > 0 ? extractedSteps : ["Open the app, register, and complete the required tasks."],
              requirements: campaign.requirements || "This offer rewards within 24 hours. New users only.",
            };
          });

          const uniqueOffers = formattedOffers.filter(
            (offer, index, self) => self.findIndex((o) => o.id === offer.id) === index
          );

          setOffers(uniqueOffers);
        } else {
          setOffers([]);
        }
      } catch (error) {
        console.error("Error fetching directly from Notik API:", error);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOffersDirectly();
  }, [user]);

  useEffect(() => {
    if (offers.length === 0) return;

    async function fetchAllVotes() {
      try {
        const querySnapshot = await getDocs(collection(db, "offerwalls"));
        const fetchedVotes: Record<string, OfferVotes> = {};

        for (const document of querySnapshot.docs) {
          const data = document.data();
          let userVote: "like" | "dislike" | null = null;

          if (user) {
            const userVoteRef = doc(db, "offerwalls", document.id, "votes", user.uid);
            const userVoteSnap = await getDoc(userVoteRef);
            if (userVoteSnap.exists()) {
              userVote = userVoteSnap.data().type;
            }
          }

          fetchedVotes[document.id] = {
            likes: data.likes || 0,
            dislikes: data.dislikes || 0,
            userVote,
          };
        }

        setVotes(fetchedVotes);
      } catch (error) {
        console.error("Error fetching votes:", error);
      }
    }

    fetchAllVotes();
  }, [offers, user]);

  const handleStartOffer = useCallback((baseUrl: string) => {
    if (!user) {
      alert("Please log in first to earn points!");
      return;
    }

    let finalUrl = baseUrl;

    if (finalUrl.includes("[USER_ID]")) {
      finalUrl = finalUrl.replace("[USER_ID]", user.uid);
    } 
    else if (!finalUrl.includes("user_id=") && !finalUrl.includes("subId=")) {
      const separator = finalUrl.includes("?") ? "&" : "?";
      finalUrl = `${finalUrl}${separator}user_id=${user.uid}`;
    }

    window.open(finalUrl, "_blank");
  }, [user]);

  const handleVote = useCallback(async (offerId: string, voteType: "like" | "dislike", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    setVotingOfferId(offerId);
    
    try {
      const offerRef = doc(db, "offerwalls", offerId);
      const userVoteRef = doc(db, "offerwalls", offerId, "votes", user.uid);
      
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

      setVotes((prev) => {
        const current = prev[offerId] || { likes: 0, dislikes: 0, userVote: null };
        const isSelected = current.userVote === voteType;
        return {
          ...prev,
          [offerId]: {
            likes: voteType === "like" ? (isSelected ? current.likes - 1 : current.likes + 1) : (current.userVote === "like" ? current.likes - 1 : current.likes),
            dislikes: voteType === "dislike" ? (isSelected ? current.dislikes - 1 : current.dislikes + 1) : (current.userVote === "dislike" ? current.dislikes - 1 : current.dislikes),
            userVote: isSelected ? null : voteType
          }
        };
      });

    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVotingOfferId(null);
    }
  }, [user]);

  const filteredOffers = useMemo(() => {
    return offers
      .filter((offer) => {
        return (
          offer.name.toLowerCase().includes(search.toLowerCase()) ||
          offer.description.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => {
        if (sortBy === "points-high") return b.mcPoints - a.mcPoints;
        if (sortBy === "points-low") return a.mcPoints - b.mcPoints;
        if (sortBy === "popular") {
          const aLikes = votes[a.id]?.likes || 0;
          const bLikes = votes[b.id]?.likes || 0;
          return bLikes - aLikes;
        }
        return a.name.localeCompare(b.name);
      });
  }, [offers, search, sortBy, votes]);

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-6 text-white">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Available Offers
          </h1>
          <p className="text-white/50 mt-1">
            Complete offers and earn MC instantly
          </p>
        </div>

        <div className="backdrop-blur-xl bg-background/40 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 h-12 rounded-xl bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 text-white">
                <SelectItem value="points-high">Highest MC</SelectItem>
                <SelectItem value="points-low">Lowest MC</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-xl border border-white/10 overflow-hidden bg-white/5">
              <Button
                variant="ghost"
                onClick={() => setViewMode("grid")}
                className={`px-4 h-12 rounded-none ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-white/50"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode("list")}
                className={`px-4 h-12 rounded-none ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-white/50"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            {filteredOffers.length} offers available
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 backdrop-blur-md bg-white/5 border border-white/10 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="backdrop-blur-xl bg-background/40 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/50 text-lg">No offers found</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {filteredOffers.map((offer) => {
              const offerVotes = votes[offer.id] || { likes: 0, dislikes: 0, userVote: null };
              const isVoting = votingOfferId === offer.id;
              
              return (
                <Card 
                  key={offer.id} 
                  onClick={() => setSelectedOffer(offer)}
                  className="backdrop-blur-xl bg-background/40 border border-white/10 rounded-2xl hover:border-primary/40 transition-all duration-300 group overflow-hidden cursor-pointer"
                >
                  <CardContent className={`p-5 flex ${viewMode === "list" ? "flex-row items-center gap-6" : "flex-col"} h-full`}>
                    
                    <div className={`flex items-center gap-4 ${viewMode === "list" ? "flex-1" : "mb-4"}`}>
                      <img 
                        src={offer.image || "/placeholder.svg"} 
                        alt={offer.name}
                        className="w-14 h-14 rounded-xl object-cover border border-white/10 bg-white/5" 
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                          {offer.name}
                        </h3>
                        <p className="text-xs text-white/40">{offer.provider}</p>
                      </div>
                    </div>

                    {viewMode === "grid" && (
                      <p className="text-white/50 text-sm line-clamp-2 mb-4 flex-grow">
                        {offer.description || "Complete this offer to earn MC"}
                      </p>
                    )}

                    <div className={`flex items-center w-full ${viewMode === "list" ? "justify-end gap-6" : "justify-between mt-auto"}`}>
                      <div className="flex items-center gap-2">
                        <img src="/coin.png" alt="MC Coin" className="h-5 w-5 object-contain" />
                        <span className="text-white font-bold text-lg">{offer.mcPoints.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost" size="sm" disabled={!user || isVoting}
                          onClick={(e) => handleVote(offer.id, "like", e)}
                          className={`h-9 px-3 rounded-lg ${offerVotes.userVote === "like" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/50"}`}
                        >
                          {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ThumbsUp className="h-4 w-4 mr-1" />{offerVotes.likes}</>}
                        </Button>
                        
                        <Button
                          variant="ghost" size="sm" disabled={!user || isVoting}
                          onClick={(e) => handleVote(offer.id, "dislike", e)}
                          className={`h-9 px-3 rounded-lg ${offerVotes.userVote === "dislike" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white/50"}`}
                        >
                          {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ThumbsDown className="h-4 w-4 mr-1" />{offerVotes.dislikes}</>}
                        </Button>

                        <Button 
                          className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold px-5 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartOffer(offer.url);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)}>
          <DialogContent className="bg-[#0b0b0c] border border-white/10 text-white max-w-xl rounded-2xl p-6 backdrop-blur-2xl">
            {selectedOffer && (
              <>
                <DialogHeader className="flex flex-row items-center gap-4 text-left">
                  <img 
                    src={selectedOffer.image || "/placeholder.svg"} 
                    alt={selectedOffer.name} 
                    className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                  />
                  <div className="space-y-1">
                    <DialogTitle className="text-xl font-bold text-white">{selectedOffer.name}</DialogTitle>
                    <DialogDescription className="text-sm text-white/40 flex items-center gap-1">
                      Provided by <span className="text-primary font-medium">{selectedOffer.provider}</span>
                    </DialogDescription>
                  </div>
                </DialogHeader>

                <hr className="border-white/10 my-2" />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" /> Description
                  </h4>
                  <p className="text-sm text-white/60 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                    {selectedOffer.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Steps & Rewards
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOffer.steps?.map((step, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-white/80 max-w-[340px]">{step}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          <img src="/coin.png" alt="MC Coin" className="h-4 w-4 object-contain" />
                          <span className="text-sm font-bold text-white">{selectedOffer.mcPoints.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white/70">Requirements</h4>
                  <p className="text-xs text-white/40 italic pl-2 border-l-2 border-primary/40">
                    {selectedOffer.requirements}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">Total Reward:</span>
                    <div className="flex items-center gap-1.5">
                      <img src="/coin.png" alt="MC Coin" className="h-5 w-5 object-contain" />
                      <span className="text-lg font-black text-primary">{selectedOffer.mcPoints.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button 
                    className="flex-1 max-w-xs h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold shadow-lg flex items-center justify-center gap-2"
                    onClick={() => handleStartOffer(selectedOffer.url)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Earn Reward Now
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
}
