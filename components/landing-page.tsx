"use client";

import { useState } from "react";
import {
  DollarSign,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Wallet,
  ChevronDown,
} from "lucide-react";
import { AuthModal } from "./auth-modal";

const features = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Earnings",
    desc: "Complete simple tasks and see your points credited in real-time.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Trusted & Secure",
    desc: "All transactions are encrypted and your data is always protected.",
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    title: "Fast Withdrawals",
    desc: "Cash out via PayPal, USDT, bank transfer or Payeer within 24 hours.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "5+ Offer Walls",
    desc: "Access 5 offer walls from top global advertisers.",
  },
];

const stats = [
  { value: "$125K+", label: "Total Paid Out" },
  { value: "50K+", label: "Active Users" },
  { value: "5+", label: "Offer Walls" },
  { value: "24h", label: "Withdrawal Time" },
];

const steps = [
  { num: "01", title: "Create Account", desc: "Sign up with your email in seconds." },
  { num: "02", title: "Complete Offers", desc: "Choose from 5+ offer walls and start earning." },
  { num: "03", title: "Withdraw Cash", desc: "Cash out your points through multiple methods." },
];

const reviews = [
  { name: "Ahmed K.", text: "Best earning platform I have ever used. Withdrawals are super fast!", rating: 5 },
  { name: "Sara M.", text: "I earned $50 in my first week. The offers are easy and pay well.", rating: 5 },
  { name: "Omar H.", text: "Reliable and trustworthy. I recommend it to everyone.", rating: 4 },
];

const faqs = [
  { q: "How do I earn points?", a: "Complete offers from our partner offer walls. Tasks include surveys, app installs, video watching, and more." },
  { q: "When can I withdraw?", a: "You need a minimum of 500 points ($5.00) to make a withdrawal request." },
  { q: "How long do withdrawals take?", a: "All withdrawal requests are processed within 24-48 hours." },
  { q: "Is this platform free?", a: "Yes! Creating an account and completing offers is completely free." },
];

export function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center neon-glow">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">
              Mr <span className="text-primary">Cash</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth("login")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              Log in
            </button>
            <button
              onClick={() => openAuth("signup")}
              className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2 rounded-xl hover:opacity-90 transition-opacity neon-glow"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              Trusted by 50,000+ users worldwide
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance max-w-3xl mx-auto">
            Earn Real Money
            <br />
            <span className="text-primary neon-text-glow">Completing Simple Tasks</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto text-pretty leading-relaxed">
            Join thousands of users earning daily. Complete offers, surveys, and tasks from top advertisers and get paid through your preferred method.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuth("signup")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity neon-glow"
            >
              Start Earning Now <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => openAuth("login")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-card border border-border text-foreground font-medium px-8 py-3.5 rounded-xl text-base hover:border-primary/30 transition-colors"
            >
              I have an account
            </button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
            {stats.map((s) => (
              <div key={s.label} className="text-center px-4">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offer Walls Preview */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground text-balance">
              5+ <span className="text-primary">Offer Walls</span> Available
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto text-pretty">
              Choose from top networks and start completing offers right away
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <OfferCard name="Adlexy" badge="Trendify" badgeColor="bg-amber-500" stars={5} />
            <OfferCard name="TaskWall" badge="TrueLeads" badgeColor="bg-emerald-500" stars={5} />
            <OfferCard name="BagiraWall" badge="TrustOffers" badgeColor="bg-orange-500" stars={4} />
            <OfferCard name="Offery" badge="2X" badgeColor="bg-red-500" stars={5} />
            <OfferCard name="GemiAd" badge="PureReward" badgeColor="bg-emerald-500" stars={4} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground text-balance">
              Why Choose <span className="text-primary">Mr Cash</span>?
            </h2>
            <p className="text-muted-foreground mt-2 text-pretty">
              Everything you need to earn and withdraw, fast and secure.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
              >
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground text-balance">
              How It <span className="text-primary">Works</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="relative bg-card border border-border rounded-xl p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-sm">{step.num}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground text-balance">
              What Our <span className="text-primary">Users</span> Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? "star-filled fill-current" : "star-empty"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-3">{`"${r.text}"`}</p>
                <p className="text-xs font-medium text-muted-foreground">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground text-balance">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-card border border-primary/20 rounded-2xl p-10 neon-glow">
            <TrendingUp className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
              Ready to Start Earning?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-pretty">
              Join 50,000+ users making money online. It only takes a minute to sign up.
            </p>
            <button
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity"
            >
              Create Free Account <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">
              Mr <span className="text-primary">Cash</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-primary" />
            <span>Secure & Trusted Platform</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {"2024 Mr Cash. All rights reserved."}
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        mode={authMode}
        setMode={setAuthMode}
      />
    </div>
  );
}

function OfferCard({
  name,
  badge,
  badgeColor,
  stars,
}: {
  name: string;
  badge: string;
  badgeColor: string;
  stars: number;
}) {
  return (
    <div className="offer-card-glow bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-primary/20 transition-colors">
      <span
        className={`text-[10px] font-bold uppercase tracking-wider text-foreground px-2.5 py-0.5 rounded-full ${badgeColor}`}
      >
        {badge}
      </span>
      <div className="h-12 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground tracking-tight">{name}</span>
      </div>
      <p className="text-xs text-muted-foreground">{name.toLowerCase()}</p>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < stars ? "star-filled fill-current" : "star-empty"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
