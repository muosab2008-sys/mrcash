"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from "@/lib/firebase";
import {
  DollarSign,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
  LayoutGrid,
  ShieldCheck,
  User as UserIcon,
  ArrowUpRight,
  Plus,
  Star,
  Activity,
  ChevronRight,
  Clock,
  Loader2
} from "lucide-react";
import Link from "next/link";

// القائمة الكاملة والنهائية لشركات العروض الـ 8
const allPartners = [
  { name: "PlaytimeAds", image: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp" },
  { name: "Revtoo", image: "https://cashlyearn.com/assets/images/networks/688bb8c3b54c5.png" },
  { name: "Adlexy", image: "https://cashlyearn.com/assets/images/networks/690655bb5acaf.webp" },
  { name: "MyLead", image: "https://cashlyearn.com/assets/images/networks/68bf403f553b5.png" },
  { name: "TaskWall", image: "https://earng.net/storage/providers/K0NuwS6fUvRVRNB8dL57yE5RyZ4vKgOoxsrWX5TE.webp" },
  { name: "BagiraWall", image: "https://bagiracash.com/assets/images/networks/698b5555a836d.png" },
  { name: "Offery", image: "https://earng.net/storage/providers/x5v40jKJIoMPSNXMmiyTkK0eWIGXHPXSsAT2QRYb.png" },
  { name: "GemiAd", image: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png" },
];

export function Dashboard() {
  const { user, balance } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات الإضافية لزيادة تفاعل الصفحة
  useEffect(() => {
    async function fetchActivities() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "transactions"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const docs = await getDocs(q);
        setActivities(docs.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16 animate-in fade-in duration-1000 overflow-hidden">
      
      {/* --- SECTION 1: PREMIUM HERO --- */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-[4rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative bg-card border-2 border-border rounded-[3.5rem] p-8 md:p-16 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Avatar Logic */}
            <div className="relative">
              <div className="h-36 w-36 rounded-[2.8rem] bg-gradient-to-tr from-primary via-indigo-500 to-purple-600 p-1.5 shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700">
                <div className="h-full w-full rounded-[2.5rem] bg-card flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-14 w-14 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-3 rounded-2xl shadow-xl border-4 border-card animate-bounce md:animate-none">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            {/* Info Logic */}
            <div className="text-center md:text-left space-y-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                  <Activity className="h-3 w-3" /> Active Session
                </span>
                <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-[0.85]">
                  Welcome, <br />
                  <span className="text-primary">{user?.displayName?.split(" ")[0] || "Player"}</span>
                </h1>
              </div>
              <p className="text-muted-foreground font-bold italic text-base flex items-center justify-center md:justify-start gap-2">
                <Zap className="h-5 w-5 text-primary fill-current" />
                Current Rank: <span className="text-foreground not-italic font-black ml-1">#1,240 Worldwide</span>
              </p>
            </div>
          </div>

          <Link href="/offers" className="group/btn relative px-14 py-7 bg-primary text-primary-foreground rounded-[2.2rem] font-black uppercase text-sm tracking-[0.2em] shadow-[0_20px_50px_rgba(234,179,8,0.3)] hover:translate-y-[-4px] active:translate-y-[2px] transition-all flex items-center gap-4">
            <Plus className="h-6 w-6 group-hover/btn:rotate-90 transition-transform duration-500" />
            Launch Offers
          </Link>
        </div>
      </section>

      {/* --- SECTION 2: STATS CARDS --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          icon={<DollarSign className="h-7 w-7" />} 
          label="Your Balance" 
          value={balance.toLocaleString()} 
          unit="POINTS" 
          color="primary" 
          description="Ready for withdrawal"
        />
        <StatCard 
          icon={<TrendingUp className="h-7 w-7" />} 
          label="USD Value" 
          value={`$${(balance / 1000).toFixed(2)}`} 
          unit="CASH" 
          color="emerald" 
          description="Market rate conversion"
        />
        <StatCard 
          icon={<Trophy className="h-7 w-7" />} 
          label="Completed" 
          value="24" 
          unit="TASKS" 
          color="amber" 
          description="Lifetime performance"
        />
        <StatCard 
          icon={<Wallet className="h-7 w-7" />} 
          label="Total Paid" 
          value="$145.50" 
          unit="PAID" 
          color="indigo" 
          description="Successfully sent"
        />
      </section>

      {/* --- SECTION 3: QUICK ACTIONS --- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ActionCard 
          href="/offers" 
          title="Offerwalls Hub" 
          sub="Access top-tier offer providers" 
          icon={<LayoutGrid className="h-10 w-10" />} 
          bg="bg-primary" 
          count="8 Providers"
        />
        <ActionCard 
          href="/withdraw" 
          title="Payment Store" 
          sub="Convert points to real money" 
          icon={<Wallet className="h-10 w-10" />} 
          bg="bg-foreground" 
          count="12 Methods"
        />
      </section>

      {/* --- SECTION 4: INFINITE MARQUEE (PARTNERS) --- */}
      <section className="space-y-10 pt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
              <Star className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter">Premium Partners</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Rewards Infrastructure</p>
            </div>
          </div>
          <Link href="/offers" className="px-6 py-3 border-2 border-border rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] hover:bg-card hover:text-primary hover:border-primary transition-all flex items-center gap-3">
            Explore All Networks <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* The Animated Marquee Container */}
        <div className="relative group py-20 bg-card/30 border-y-2 border-border/50 overflow-hidden">
          <div className="flex w-fit animate-marquee hover:pause">
            {/* We multiply the array to ensure seamless loop */}
            {[...allPartners, ...allPartners, ...allPartners].map((partner, index) => (
              <div key={index} className="flex flex-col items-center gap-8 px-20 group/item transition-all duration-700">
                <div className="h-20 w-44 flex items-center justify-center filter grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover/item:scale-110">
                  <img src={partner.image} alt={partner.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="text-center space-y-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                  <p className="text-sm font-black text-foreground uppercase tracking-tighter">{partner.name}</p>
                  <div className="flex gap-1 justify-center">
                    {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 text-amber-500 fill-current" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Luxury Fading Edge Overlays */}
          <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-background via-background/40 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-background via-background/40 to-transparent z-10 pointer-events-none" />
        </div>
      </section>

      {/* --- CSS ENGINE --- */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .hover\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>

    </div>
  );
}

// --- SUB-COMPONENTS (DETAILED) ---

function StatCard({ icon, label, value, unit, color, description }: any) {
  const themes: any = {
    primary: "text-primary bg-primary/10 border-primary/20 shadow-primary/5",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
    indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5",
  };

  return (
    <div className="bg-card border-2 border-border rounded-[2.5rem] p-8 group hover:border-primary transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className={`p-4 rounded-2xl ${themes[color].split(' ').slice(0, 3).join(' ')} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="h-2 w-2 rounded-full bg-border group-hover:bg-primary animate-pulse" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-black text-foreground tracking-tighter">{value}</h3>
          <span className={`text-[10px] font-black uppercase ${themes[color].split(' ')[0]}`}>{unit}</span>
        </div>
        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase pt-2">{description}</p>
      </div>
    </div>
  );
}

function ActionCard({ href, title, sub, icon, bg, count }: any) {
  return (
    <Link href={href} className="group relative flex items-center justify-between p-12 bg-card border-2 border-border rounded-[3.5rem] hover:border-primary transition-all duration-700 overflow-hidden">
      <div className="flex items-center gap-10 relative z-10">
        <div className={`h-24 w-24 rounded-[2rem] flex items-center justify-center text-white ${bg} shadow-2xl transition-all duration-700 group-hover:rotate-[360deg] group-hover:scale-110`}>
          {icon}
        </div>
        <div className="text-left space-y-2">
          <span className="px-3 py-1 bg-secondary rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">{count}</span>
          <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">{title}</h3>
          <p className="text-sm font-bold text-muted-foreground uppercase group-hover:text-primary transition-colors">{sub}</p>
        </div>
      </div>
      <div className="relative z-10 h-16 w-16 bg-secondary rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
        <ArrowUpRight className="h-8 w-8 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 h-full w-2 bg-primary transform translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
    </Link>
  );
}
