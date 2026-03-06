"use client";



import { useAuth } from "@/lib/auth-context";

import { useState, useEffect } from "react";

import { 

  ArrowLeft, 

  ExternalLink, 

  X, 

  Star, 

  Shield, 

  Loader2, 

  Trophy, 

  Zap,

  Info,

  CheckCircle2,

  Lock

} from "lucide-react";



// 1. تعريف واجهة البيانات لكل شركة عروض

interface OfferWall {

  id: string;

  name: string;

  displayName: string;

  description: string;

  getUrl: (uid: string) => string;

  badge: string;

  badgeColor: string;

  stars: number;

  image: string;

  category: string;

}



// 2. مصفوفة البيانات الكاملة مع جميع الصور التي أرسلتها

const offerWalls: OfferWall[] = [

  {

    id: "playtimeads",

    name: "PlaytimeAds",

    displayName: "Play & Earn",

    description: "Earn points for every minute you play your favorite mobile games!",

    getUrl: (uid) => `https://web.playtimeads.com/index.php?app_id=6d186de0e9e5e8d7&user_id=${uid}`,

    badge: "Most Popular",

    badgeColor: "bg-indigo-600",

    stars: 5,

    image: "https://earng.net/storage/providers/zeG92gZZxlLyVw6nTwvBWeFN4eV6l1Lqy90xQzHZ.webp",

    category: "Games"

  },

  {

    id: "revtoo",

    name: "Revtoo",

    displayName: "Instant Rewards",

    description: "Exclusive high-paying tasks and instant reward offers.",

    getUrl: (uid) => `https://revtoo.com/offerwall/mhvkxh5tm0j7710rcp7g4cvf6irlal/${uid}`,

    badge: "Hot",

    badgeColor: "bg-purple-600",

    stars: 5,

    image: "https://cashlyearn.com/assets/images/networks/688bb8c3b54c5.png",

    category: "Tasks"

  },

  {

    id: "adlexy",

    name: "Adlexy",

    displayName: "Top Offers",

    description: "Complete offers and earn points from top advertisers worldwide.",

    getUrl: (uid) => `https://adlexy.com/offerwall/h7mx23bis2zaib6apwwe73uv3gr92i/${uid}`,

    badge: "Trending",

    badgeColor: "bg-amber-500",

    stars: 5,

    image: "https://cashlyearn.com/assets/images/networks/690655bb5acaf.webp",

    category: "Offers"

  },

  {

    id: "taskwall",

    name: "TaskWall",

    displayName: "Elite Tasks",

    description: "High-paying tasks and offers from top advertisers.",

    getUrl: (uid) => `https://wall.taskwall.io/?app_id=e723adebdbab293255deefe5fe401b43&userid=${uid}`,

    badge: "High Pay",

    badgeColor: "bg-emerald-500",

    stars: 5,

    image: "https://earng.net/storage/providers/K0NuwS6fUvRVRNB8dL57yE5RyZ4vKgOoxsrWX5TE.webp",

    category: "Tasks"

  },

  {

    id: "bagirawall",

    name: "BagiraWall",

    displayName: "Fast Credit",

    description: "Wide variety of surveys and mobile offers with fast crediting.",

    getUrl: (uid) => `https://bagirawall.com/offerwall/7/${uid}`,

    badge: "New",

    badgeColor: "bg-orange-500",

    stars: 4,

    image: "https://bagiracash.com/assets/images/networks/698b5555a836d.png",

    category: "Surveys"

  },

  {

    id: "offery",

    name: "Offery",

    displayName: "Premium Wall",

    description: "Premium offers with high conversion rates and bonuses.",

    getUrl: (uid) => `https://offery.io/offerwall/rvzyjt0dpo0ogh392veso95xr1ok01/${uid}`, 

    badge: "2X Points",

    badgeColor: "bg-red-500",

    stars: 5,

    image: "https://earng.net/storage/providers/x5v40jKJIoMPSNXMmiyTkK0eWIGXHPXSsAT2QRYb.png",

    category: "Offers"

  },

  {

    id: "gemiad",

    name: "GemiAd",

    displayName: "Global Reach",

    description: "Global offers available in multiple regions with great payouts.",

    getUrl: (uid) => `https://gemiwall.com/6977536ec6ceefce12a28330/${uid}`, 

    badge: "Stable",

    badgeColor: "bg-blue-500",

    stars: 4,

    image: "https://earng.net/storage/providers/5t91vghsZuzh5mBa1uDlmfpjjMH05idKJtU8VjcB.png",

    category: "Global"

  },

  {

    id: "MyLead",

    name: "MyLead",

    displayName: "Expert Choice",

    description: "Global tasks and premium surveys from the MyLead network.",

    getUrl: (uid) => `https://reward-me.eu/a1efb724-15b2-11f1-8a24-129a1c289511?player_id=${uid}`,

    badge: "Verified",

    badgeColor: "bg-slate-800",

    stars: 5,

    // تم استخدام الصورة الجديدة التي أرسلتها هنا

    image: "https://cashlyearn.com/assets/images/networks/68bf403f553b5.png",

    category: "Expert"

  }

];



export function OffersPage() {

  const { user } = useAuth();

  const [activeWall, setActiveWall] = useState<OfferWall | null>(null);

  const [isIframeLoading, setIsIframeLoading] = useState(true);



  // إعادة ضبط حالة التحميل عند فتح جدار جديد

  useEffect(() => {

    if (activeWall) {

      setIsIframeLoading(true);

      // تأمين الخروج عند ضغط زر التراجع في المتصفح

      const handleBackButton = () => setActiveWall(null);

      window.addEventListener('popstate', handleBackButton);

      return () => window.removeEventListener('popstate', handleBackButton);

    }

  }, [activeWall]);



  if (!user) {

    return (

      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">

        <div className="relative">

          <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />

          <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />

        </div>

        <div className="text-center">

          <p className="text-xl font-black text-foreground uppercase tracking-widest">Authenticating Session</p>

          <p className="text-sm text-muted-foreground mt-2">Connecting to secure offerwall servers...</p>

        </div>

      </div>

    );

  }



  // --- شاشة عرض الـ iFrame (عند اختيار شركة) ---

  if (activeWall) {

    return (

      <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in duration-500">

        {/* Header التحكّم */}

        <div className="bg-card border-b border-border px-4 md:px-10 py-5 flex items-center justify-between shadow-xl">

          <div className="flex items-center gap-5">

            <button 

              onClick={() => setActiveWall(null)} 

              className="p-3 hover:bg-secondary rounded-2xl transition-all active:scale-90 border border-border"

            >

              <ArrowLeft className="h-6 w-6 text-foreground" />

            </button>

            <div className="flex items-center gap-4">

              <div className="h-12 w-12 bg-white rounded-xl p-1.5 shadow-inner hidden xs:flex items-center justify-center border border-border">

                <img src={activeWall.image} alt="" className="max-h-full max-w-full object-contain" />

              </div>

              <div>

                <h2 className="font-black text-foreground text-xl leading-none tracking-tight uppercase">

                  {activeWall.name}

                </h2>

                <div className="flex items-center gap-2 mt-1.5">

                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Verified Secure Portal</span>

                </div>

              </div>

            </div>

          </div>



          <div className="flex items-center gap-3">

            <a 

              href={activeWall.getUrl(user.uid)} 

              target="_blank" 

              rel="noopener noreferrer" 

              className="hidden lg:flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-primary/20"

            >

              <ExternalLink className="h-4 w-4" />

              Full Screen Mode

            </a>

            <button 

              onClick={() => setActiveWall(null)} 

              className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"

            >

              <X className="h-8 w-8" />

            </button>

          </div>

        </div>



        {/* منطقة الـ iFrame */}

        <div className="flex-1 w-full bg-background relative overflow-hidden">

          {isIframeLoading && (

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 space-y-6">

              <div className="relative h-24 w-24">

                <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />

                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />

                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />

              </div>

              <div className="text-center space-y-2">

                <p className="text-lg font-black text-foreground uppercase tracking-tighter">Establishing Handshake</p>

                <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.3em]">Syncing User: {user.uid.substring(0,8)}</p>

              </div>

            </div>

          )}

          <iframe 

            src={activeWall.getUrl(user.uid)} 

            onLoad={() => setIsIframeLoading(false)}

            title={activeWall.name} 

            className="w-full h-full border-0" 

            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation" 

            loading="eager"

            allow="gamepad; geolocation; microphone; camera"

          />

        </div>

      </div>

    );

  }



  // --- الواجهة الرئيسية (قائمة العروض) ---

  return (

    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">

      

      {/* Header القسم */}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

        <div className="space-y-4">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">

            <Trophy className="h-4 w-4 text-primary" />

            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Premium Rewards Ecosystem</span>

          </div>

          <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">

            Earn <span className="text-primary drop-shadow-sm">Points</span><br />

            Boost Balance

          </h1>

          <p className="text-muted-foreground text-lg font-medium max-w-xl">

            Choose from our elite selection of global offerwall partners. Complete simple tasks to earn <span className="text-foreground font-bold underline decoration-primary/40">MC Points</span> instantly.

          </p>

        </div>



        <div className="hidden lg:block bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">

            <div className="flex items-center gap-6">

                <div className="text-center space-y-1">

                    <p className="text-3xl font-black text-foreground">100%</p>

                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Safe Payouts</p>

                </div>

                <div className="h-10 w-px bg-border" />

                <div className="text-center space-y-1">

                    <p className="text-3xl font-black text-primary">24h</p>

                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Audit Time</p>

                </div>

            </div>

        </div>

      </div>



      {/* تنبيه الأمان */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-6 flex items-center gap-5">

              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">

                  <CheckCircle2 className="h-6 w-6" />

              </div>

              <div>

                  <p className="text-sm font-black text-foreground uppercase">Anti-Fraud Protection</p>

                  <p className="text-xs text-muted-foreground font-medium mt-1">Our system monitors for VPN/Proxy use to ensure your points are always valid.</p>

              </div>

          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 flex items-center gap-5">

              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">

                  <Zap className="h-6 w-6" />

              </div>

              <div>

                  <p className="text-sm font-black text-foreground uppercase">High Payout Multiplier</p>

                  <p className="text-xs text-muted-foreground font-medium mt-1">Special weekend bonus active! Earn up to 2x points on selected walls.</p>

              </div>

          </div>

      </div>



      {/* شبكة جدران العروض */}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        {offerWalls.map((wall) => (

          <button

            key={wall.id}

            onClick={() => setActiveWall(wall)}

            className="group relative flex flex-col bg-card border-2 border-border rounded-[3rem] p-10 transition-all duration-500 hover:border-primary hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] hover:-translate-y-3"

          >

            {/* الشارة العلوية */}

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">

              <span className={`whitespace-nowrap text-[9px] font-black uppercase tracking-[0.2em] text-white px-5 py-2 rounded-full ${wall.badgeColor} shadow-xl border-2 border-background`}>

                {wall.badge}

              </span>

            </div>

            

            {/* الصورة المركزية للشركة */}

            <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] space-y-8">

              <div className="h-28 w-full flex items-center justify-center p-2 relative">

                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <img 

                  src={wall.image} 

                  alt={wall.name} 

                  className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:drop-shadow-2xl transition-all duration-500 scale-100 group-hover:scale-110" 

                />

              </div>



              {/* الاسم والنجوم */}

              <div className="text-center space-y-3">

                <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter group-hover:text-primary transition-colors">

                  {wall.name}

                </h3>

                <div className="flex items-center justify-center gap-1.5">

                  {Array.from({ length: 5 }).map((_, i) => (

                    <Star key={i} className={`h-4 w-4 ${i < wall.stars ? "text-yellow-500 fill-current shadow-sm" : "text-muted-foreground/20"}`} />

                  ))}

                </div>

              </div>

            </div>



            {/* زر الدخول السفلي */}

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">

               <div className="flex flex-col items-start">

                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Category</span>

                  <span className="text-[10px] font-black text-foreground uppercase mt-1">{wall.category}</span>

               </div>

               <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">

                  <ArrowLeft className="h-4 w-4 rotate-180" />

               </div>

            </div>

          </button>

        ))}

      </div>



      {/* الفوتر الاحترافي */}

      <div className="pt-20 pb-10 border-t border-border/50 flex flex-col items-center space-y-8">

        <div className="flex flex-wrap justify-center items-center gap-10 opacity-30 grayscale hover:opacity-60 transition-all duration-1000">

           {offerWalls.map(w => (

             <img key={w.id} src={w.image} className="h-5 md:h-7 w-auto object-contain" alt="" />

           ))}

        </div>

        <div className="text-center space-y-2">

            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.6em]">

              Mr Cash Security Protocol • V4.0.2

            </p>

            <p className="text-[8px] text-muted-foreground/50 font-medium uppercase italic">

              All transactions are subject to manual audit based on advertiser feedback.

            </p>

        </div>

      </div>



      <style jsx>{`

        .no-scrollbar::-webkit-scrollbar { display: none; }

        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      `}</style>



    </div>

  );

}
