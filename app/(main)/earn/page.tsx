"use client";

import { CheckCircle, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { OfferCarousel } from "@/components/offers/offer-carousel";
import { PartnerBanner } from "@/components/partners/partner-banner";
import { PartnerCard } from "@/components/partners/partner-card";
import { mockOffers, mockPartners } from "@/lib/mock-data";

export default function EarnPage() {
  const [showBanner, setShowBanner] = useState(true);

  // Get featured partners for banners
  const featuredPartners = mockPartners.filter((p) => p.featured);
  const regularPartners = mockPartners.filter((p) => !p.featured);

  // Sort offers by popularity (completions)
  const popularOffers = [...mockOffers].sort(
    (a, b) => b.completions - a.completions
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Welcome Banner */}
      {showBanner && (
        <div className="relative flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-sm">
          <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-foreground">
            <Sparkles className="mr-1 inline h-4 w-4 text-primary" />
            Discover exclusive features and enjoy a smart and seamless
            experience on the platform
          </p>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Popular Offers Carousel */}
      <OfferCarousel
        title="Popular Offers"
        offers={popularOffers.slice(0, 10)}
        viewAllHref="/offers"
      />

      {/* Featured Partners Banners */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Featured Partners
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featuredPartners.map((partner) => (
            <PartnerBanner key={partner.id} partner={partner} />
          ))}
        </div>
      </section>

      {/* Offer Partners Grid */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Offer Partners</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {regularPartners.slice(0, 10).map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </section>
    </div>
  );
}
