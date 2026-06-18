"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ExternalLink, Search, LayoutGrid, List, ThumbsUp, ThumbsDown, Loader2, TrendingUp, Info, CheckCircle2, Milestone } from "lucide-react";

interface OfferTask { taskName: string; points: number; }

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
  multiTasks?: OfferTask[];
}

interface OfferVotes { likes: number; dislikes: number; userVote: "like" | "dislike" | null; }

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
    async function fetchOffers() {
      setLoading(true);
      try {
        const currentUid = user ? user.uid : "demo-user-1";
        const notikUrl = new URL("https://notik.me/api/v1/live-campaigns-for-user");
        notikUrl.searchParams.append("api_key", "NofGnODVnHB3werypR5PRKx5ew8fTbB4");
        notikUrl.searchParams.append("pub_id", "Yog41D");
        notikUrl.searchParams.append("app_id", "psPQDvAS3y");
        notikUrl.searchParams.append("user_id", currentUid);

        const response = await fetch(notikUrl.toString());
        const result = await response.json();
        const campaigns = result.campaigns || result.data || [];
        
        // --- تعديل النقاط ---
        // إذا كنت تريد تقليل النقاط المليونية، غيّر الرقم 1 في المتغير أدناه إلى رقم أكبر (مثلاً 1000)
        const DIVISOR = 1; 

        const formattedOffers = campaigns.map((campaign: any, index: number) => {
          const rawPoints = Number(campaign.points) || Number(campaign.payout) * 500;
          
          let parsedTasks: OfferTask[] = [];
          if (campaign.events) {
            parsedTasks = campaign.events.map((ev: any) => ({
              taskName: ev.event_name,
              points: Math.round(Number(ev.points) / DIVISOR)
            }));
          }

          return {
            id: String(campaign.campaign_id || index),
            name: campaign.name || "Offer",
            description: campaign.description || "",
            provider: "Notik",
            payout: Number(campaign.payout),
            mcPoints: Math.round(rawPoints / DIVISOR),
            image: campaign.image_url || "/placeholder.svg",
            url: campaign.click_url,
            steps: campaign.steps || [],
            multiTasks: parsedTasks.length > 0 ? parsedTasks : undefined
          };
        });
        setOffers(formattedOffers);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, [user]);

  // منطق التصويت والترتيب كما كان سابقاً...
  const filteredOffers = useMemo(() => {
    return offers.filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => sortBy === "points-high" ? b.mcPoints - a.mcPoints : a.mcPoints - b.mcPoints);
  }, [offers, search, sortBy]);

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Available Offers</h1>
            <p className="text-white/50 text-sm">Complete offers and earn MC instantly</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-background/40 border border-white/10 rounded-2xl p-4">
          <div className="flex gap-4">
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white/5 border-white/10" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] text-white">
                <SelectItem value="points-high">Highest MC</SelectItem>
                <SelectItem value="points-low">Lowest MC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} onClick={() => setSelectedOffer(offer)} className="cursor-pointer bg-background/40 border border-white/10 hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <img src={offer.image} alt={offer.name} className="w-12 h-12 rounded-xl" />
                  <div>
                    <h3 className="font-bold">{offer.name}</h3>
                    <p className="text-xs text-white/50">{offer.provider}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">{offer.mcPoints.toLocaleString()} MC</span>
                  <Button size="sm" className="bg-primary">Start</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)}>
          <DialogContent className="bg-[#0b0b0c] border border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedOffer?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-white/60">{selectedOffer?.description}</p>
              {selectedOffer?.multiTasks && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2"><Milestone className="h-4 w-4" /> Rewards Breakdown</h4>
                  {selectedOffer.multiTasks.map((t, i) => (
                    <div key={i} className="flex justify-between p-2 bg-white/5 rounded border border-white/10 text-sm">
                      <span>{t.taskName}</span>
                      <span className="text-primary font-bold">+{t.points.toLocaleString()} MC</span>
                    </div>
                  ))}
                </div>
              )}
              <Button className="w-full" onClick={() => selectedOffer && window.open(selectedOffer.url)}>Start Offer</Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
