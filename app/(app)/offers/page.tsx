"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Search, Filter, LayoutGrid, List, DollarSign } from "lucide-react";

// Helper to convert points to USD
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

interface Offer {
  id: string;
  name: string;
  description: string;
  provider: string;
  points: number;
  fragments: number;
  difficulty: "easy" | "medium" | "hard";
  type: "survey" | "app" | "video" | "signup" | "other";
  url: string;
  isActive: boolean;
}

const defaultOffers: Offer[] = [
  {
    id: "1",
    name: "Complete Quick Survey",
    description: "Answer a few questions about your shopping habits",
    provider: "CPX Research",
    points: 250,
    fragments: 5,
    difficulty: "easy",
    type: "survey",
    url: "#",
    isActive: true,
  },
  {
    id: "2",
    name: "Download & Play Mobile Game",
    description: "Install the game and reach level 10",
    provider: "OfferToro",
    points: 1500,
    fragments: 30,
    difficulty: "medium",
    type: "app",
    url: "#",
    isActive: true,
  },
  {
    id: "3",
    name: "Watch Video Ads",
    description: "Watch 5 short video advertisements",
    provider: "AdGate",
    points: 100,
    fragments: 2,
    difficulty: "easy",
    type: "video",
    url: "#",
    isActive: true,
  },
  {
    id: "4",
    name: "Sign Up for Newsletter",
    description: "Subscribe to a partner newsletter with valid email",
    provider: "Revenue Universe",
    points: 200,
    fragments: 4,
    difficulty: "easy",
    type: "signup",
    url: "#",
    isActive: true,
  },
  {
    id: "5",
    name: "Complete Product Survey",
    description: "Share your opinion on new products (20 min)",
    provider: "Bitlabs",
    points: 800,
    fragments: 16,
    difficulty: "medium",
    type: "survey",
    url: "#",
    isActive: true,
  },
  {
    id: "6",
    name: "Install & Use Shopping App",
    description: "Install app and make your first purchase",
    provider: "Lootably",
    points: 3000,
    fragments: 60,
    difficulty: "hard",
    type: "app",
    url: "#",
    isActive: true,
  },
];

const difficultyConfig = {
  easy: { label: "Easy", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  hard: { label: "Hard", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const typeConfig = {
  survey: { label: "Survey", color: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20" },
  app: { label: "App Install", color: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20" },
  video: { label: "Video", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
  signup: { label: "Sign Up", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  other: { label: "Other", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(defaultOffers);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("points-high");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const q = query(collection(db, "offers"), orderBy("points", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Offer[];
          setOffers(data.filter((o) => o.isActive));
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter and sort offers
  const filteredOffers = offers
    .filter((offer) => {
      const matchesSearch =
        offer.name.toLowerCase().includes(search.toLowerCase()) ||
        offer.description.toLowerCase().includes(search.toLowerCase()) ||
        offer.provider.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || offer.type === filterType;
      const matchesDifficulty =
        filterDifficulty === "all" || offer.difficulty === filterDifficulty;
      return matchesSearch && matchesType && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "points-high":
          return b.points - a.points;
        case "points-low":
          return a.points - b.points;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">All Offers</h1>
        <p className="text-white/50">
          Browse and complete offers to earn money
        </p>
      </div>

      {/* Filters */}
      <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <Input
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-2xl bg-white/[0.02] border-white/5 focus:border-[#3B82F6]/50 text-white placeholder:text-white/30"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-40 h-12 rounded-2xl bg-white/[0.02] border-white/5 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="survey">Survey</SelectItem>
                <SelectItem value="app">App Install</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="signup">Sign Up</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full lg:w-40 h-12 rounded-2xl bg-white/[0.02] border-white/5 text-white">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-xl">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-44 h-12 rounded-2xl bg-white/[0.02] border-white/5 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 rounded-xl">
                <SelectItem value="points-high">Highest Points</SelectItem>
                <SelectItem value="points-low">Lowest Points</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex rounded-2xl border border-white/5 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-none px-4 h-12 ${viewMode === "grid" ? "bg-white/5 text-white" : "text-white/50"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`rounded-none px-4 h-12 ${viewMode === "list" ? "bg-white/5 text-white" : "text-white/50"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-white/40">
        Showing {filteredOffers.length} of {offers.length} offers
      </p>

      {/* Offers Grid/List */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-white/5 bg-[#0a0a0a] rounded-2xl animate-pulse">
              <CardContent className="p-5">
                <div className="h-6 w-3/4 bg-white/5 rounded-lg mb-3" />
                <div className="h-4 w-full bg-white/5 rounded-lg mb-4" />
                <div className="h-12 w-full bg-white/5 rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <Card className="border-white/5 bg-[#0a0a0a] rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="mb-4 h-12 w-12 text-white/30" />
            <p className="text-lg font-medium text-white">No offers found</p>
            <p className="text-sm text-white/50">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card
              key={offer.id}
              className="border-white/5 bg-[#0a0a0a] rounded-2xl transition-all hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/5"
            >
              <CardHeader className="pb-3 p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge className={difficultyConfig[offer.difficulty].color + " border rounded-xl text-xs px-3 py-1"}>
                    {difficultyConfig[offer.difficulty].label}
                  </Badge>
                  <Badge className={typeConfig[offer.type].color + " border rounded-xl text-xs px-3 py-1"}>
                    {typeConfig[offer.type].label}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-white line-clamp-1">{offer.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-white/50 text-sm">{offer.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="mb-4 text-xs text-white/40">
                  Provider: {offer.provider}
                </p>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black text-lg text-white">
                      ${pointsToUSD(offer.points)}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold h-12 rounded-2xl shadow-lg shadow-[#3B82F6]/20"
                  onClick={() => window.open(offer.url, "_blank")}
                >
                  Start Offer
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer) => (
            <Card
              key={offer.id}
              className="border-white/5 bg-[#0a0a0a] rounded-2xl transition-all hover:border-[#3B82F6]/30"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white">{offer.name}</h3>
                    <Badge className={difficultyConfig[offer.difficulty].color + " border rounded-xl text-[10px] px-2 py-0.5"}>
                      {difficultyConfig[offer.difficulty].label}
                    </Badge>
                    <Badge className={typeConfig[offer.type].color + " border rounded-xl text-[10px] px-2 py-0.5"}>
                      {typeConfig[offer.type].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-1">
                    {offer.description}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Provider: {offer.provider}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-[#3B82F6]" />
                      <span className="font-black text-xl text-white">
                        {pointsToUSD(offer.points)}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold rounded-2xl"
                    onClick={() => window.open(offer.url, "_blank")}
                  >
                    Start
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
