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
import { ExternalLink, Coins, Zap, Search, Filter, LayoutGrid, List } from "lucide-react";

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
  easy: { label: "Easy", color: "bg-emerald-500/10 text-emerald-500" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-500" },
  hard: { label: "Hard", color: "bg-red-500/10 text-red-500" },
};

const typeConfig = {
  survey: { label: "Survey", color: "bg-blue-500/10 text-blue-500" },
  app: { label: "App Install", color: "bg-purple-500/10 text-purple-500" },
  video: { label: "Video", color: "bg-pink-500/10 text-pink-500" },
  signup: { label: "Sign Up", color: "bg-cyan-500/10 text-cyan-500" },
  other: { label: "Other", color: "bg-gray-500/10 text-gray-500" },
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">All Offers</h1>
        <p className="text-muted-foreground">
          Browse and complete offers to earn points and fragments
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points-high">Highest Points</SelectItem>
                <SelectItem value="points-low">Lowest Points</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-secondary" : ""}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-secondary" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredOffers.length} of {offers.length} offers
      </p>

      {/* Offers Grid/List */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                <div className="h-4 w-full bg-muted rounded mb-4" />
                <div className="h-10 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No offers found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card
              key={offer.id}
              className="border-border bg-card transition-all hover:border-[var(--brand-cyan)]/50 hover:shadow-lg hover:shadow-[var(--brand-cyan)]/10"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={difficultyConfig[offer.difficulty].color + " border-0"}>
                    {difficultyConfig[offer.difficulty].label}
                  </Badge>
                  <Badge className={typeConfig[offer.type].color + " border-0"}>
                    {typeConfig[offer.type].label}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-1">{offer.name}</CardTitle>
                <CardDescription className="line-clamp-2">{offer.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">
                  Provider: {offer.provider}
                </p>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-[var(--brand-cyan)]" />
                    <span className="font-bold text-[var(--brand-cyan)]">
                      {offer.points.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-[var(--brand-purple)]" />
                    <span className="font-bold text-[var(--brand-purple)]">
                      +{offer.fragments}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full brand-gradient text-primary-foreground"
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
              className="border-border bg-card transition-all hover:border-[var(--brand-cyan)]/50"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-bold">{offer.name}</h3>
                    <Badge className={difficultyConfig[offer.difficulty].color + " border-0 text-xs"}>
                      {difficultyConfig[offer.difficulty].label}
                    </Badge>
                    <Badge className={typeConfig[offer.type].color + " border-0 text-xs"}>
                      {typeConfig[offer.type].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {offer.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provider: {offer.provider}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-[var(--brand-cyan)]" />
                      <span className="font-bold text-[var(--brand-cyan)]">
                        {offer.points.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-[var(--brand-purple)]" />
                      <span className="text-sm text-[var(--brand-purple)]">
                        +{offer.fragments}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="brand-gradient text-primary-foreground"
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
