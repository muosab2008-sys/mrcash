"use client";

import { useState, useMemo } from "react";
import { Search, Monitor, Smartphone, Apple, Flame, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfferCard } from "@/components/offers/offer-card";
import { mockOffers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Platform = "android" | "ios" | "desktop";
type SortOption = "popular" | "newest" | "highest" | "lowest";

const platformFilters: { id: Platform; label: string; icon: React.ElementType }[] = [
  { id: "android", label: "Android", icon: Smartphone },
  { id: "ios", label: "iOS", icon: Apple },
  { id: "desktop", label: "Desktop", icon: Monitor },
];

export default function OffersPage() {
  const [search, setSearch] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "android",
    "ios",
    "desktop",
  ]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const filteredOffers = useMemo(() => {
    let offers = [...mockOffers];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      offers = offers.filter(
        (offer) =>
          offer.name.toLowerCase().includes(searchLower) ||
          offer.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by platforms
    if (selectedPlatforms.length > 0 && selectedPlatforms.length < 3) {
      offers = offers.filter((offer) =>
        offer.platforms.some((p) => selectedPlatforms.includes(p))
      );
    }

    // Sort
    switch (sortBy) {
      case "popular":
        offers.sort((a, b) => b.completions - a.completions);
        break;
      case "newest":
        // In a real app, this would sort by createdAt
        offers.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      case "highest":
        offers.sort((a, b) => b.points - a.points);
        break;
      case "lowest":
        offers.sort((a, b) => a.points - b.points);
        break;
    }

    return offers;
  }, [search, selectedPlatforms, sortBy]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Offers</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Platform Filters */}
        <div className="flex gap-2">
          {platformFilters.map(({ id, label, icon: Icon }) => {
            const isSelected = selectedPlatforms.includes(id);
            return (
              <button
                key={id}
                onClick={() => togglePlatform(id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card pl-9"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="highest">Highest Points</SelectItem>
              <SelectItem value="lowest">Lowest Points</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {/* Empty State */}
      {filteredOffers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Flame className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground">
            No offers found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
}
