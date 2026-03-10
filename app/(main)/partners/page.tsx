"use client";

import { Sparkles } from "lucide-react";
import { PartnerBanner } from "@/components/partners/partner-banner";
import { PartnerCard } from "@/components/partners/partner-card";
import { mockPartners } from "@/lib/mock-data";

export default function PartnersPage() {
  const featuredPartners = mockPartners.filter((p) => p.featured);
  const regularPartners = mockPartners.filter((p) => !p.featured);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Featured Partners */}
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

      {/* All Partners */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Offer Partners</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {regularPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </section>
    </div>
  );
}
