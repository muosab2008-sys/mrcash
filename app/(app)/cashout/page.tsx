"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  collection, doc, onSnapshot, query, where, orderBy, serverTimestamp, runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, Zap, Clock, History, Info, X } from "lucide-react";

// --- أيقونة العملة الخاصة بك ---
const COIN_ICON = "/coin.png"; 

const CASHOUT_CATEGORIES = [
  {
    title: "Cashout Methods",
    methods: [
      { 
        id: "paypal", 
        name: "PayPal", 
        icon: "https://earng.net/storage/images/oipeSzxn0qPxwAFms2XGG7K8cGO5TznxhlQ8TmcL.png", 
        minPoints: 2000, 
        inputLabel: "PayPal Email Address",
        placeholder: "example@mail.com",
        amounts: [{ points: 10000, usd: 10 }, { points: 5000, usd: 5 }, { points: 2000, usd: 2 }] 
      },
      { 
        id: "visa", 
        name: "Visa Tremendous", 
        icon: "https://earng.net/storage/images/b7e5Ish9TrqPixjxgUXjGIZfAizgbxivJTLm9Nhq.png", 
        minPoints: 1000, 
        inputLabel: "Email Address",
        placeholder: "Enter your email for the card",
        amounts: [{ points: 5000, usd: 5 }, { points: 2000, usd: 2 }, { points: 1000, usd: 1 }] 
      },
    ]
  },
  {
    title: "Crypto & Wallets",
    methods: [
      { 
        id: "faucetpay", 
        name: "FaucetPay", 
        icon: "https://earng.net/storage/temp-images/niLsNzBAPnZvq2XFAijzOc5fEXOFN0Fh1QKaE5Wv.png", 
        minPoints: 50, 
        inputLabel: "FaucetPay Email Address",
        placeholder: "Enter FaucetPay email",
        amounts: [{ points: 1000, usd: 1 }, { points: 500, usd: 0.5 }, { points: 50, usd: 0.05 }] 
      },
      { 
        id: "binance", 
        name: "Binance", 
        icon: "https://earng.net/storage/images/ZweowA5mo9MrohnCYKI3VkCfJGZwbVLBbH24QUXU.png", 
        minPoints: 50, 
        inputLabel: "Binance Pay ID / Email",
        placeholder: "Enter Binance ID or Email",
        amounts: [{ points: 1000, usd: 1 }, { points: 500, usd: 0.5 }, { points: 50, usd: 0.05 }] 
      },
      { 
        id: "litecoin", 
        name: "Litecoin", 
        icon: "https://earng.net/storage/images/c2YcgB4WR4QIpNjZWXULqMcthmyUQHKMg9o1Wnl6.png", 
        minPoints: 2000, 
        inputLabel: "LTC Wallet Address",
        placeholder: "Enter your LTC address",
        amounts: [{ points: 10000, usd: 10 }, { points: 5000, usd: 5 }, { points: 2000, usd: 2 }] 
      },
     { 
 id: "cwallet", 
        name: "cWallet", 
        icon: "https://earng.net/storage/images/CVMa2olhLqSdi0DhCsurT7qVZNzubx0Bv6yjaWE7.png", 
        minPoints: 50, 
        inputLabel: "cWallet ID / Email",
        placeholder: "Enter cWallet ID or Email",
        amounts: [{ points: 1000, usd: 1 }, { points: 500, usd: 0.5 }, { points: 50, usd: 0.05 }]
         },
  ]
  },
  {
    title: "Gift Cards",
    methods: [
      { id: "amazon", name: "Amazon", icon: "https://earng.net/storage/images/HjLzhYmDg1Kul5979jLDii0BCfiQdE8Z2fzaLFWT.png", minPoints: 1000, inputLabel: "Email Address", placeholder: "Email for delivery", amounts: [{ points: 5000, usd: 5 }, { points: 1000, usd: 1 }] },
      { id: "google", name: "Google Play US", icon: "https://earng.net/storage/images/cR9c5tKppt6nWks7U1WS2Hp2S10zX6gPHMEuYPII.png", minPoints: 5000, inputLabel: "Email Address", placeholder: "Email for delivery", amounts: [{ points: 10000, usd: 10 }, { points: 5000, usd: 5 }] },
      { id: "itunes", name: "iTunes Apple", icon: "https://earng.net/storage/images/fEtLXen6YAH82wW1uS5osza3t1APXcKINWrCOixH.png", minPoints: 5000, inputLabel: "Email Address", placeholder: "Email for delivery", amounts: [{ points: 10000, usd: 10 }, { points: 5000, usd: 5 }] },
    ]
  },
  {
    title: "Skins & Gaming",
    methods: [
      { id: "pubg", name: "PUBG Mobile", icon: "https://earng.net/storage/temp-images/33d2d2cjBBy67mkJkMPfREmBUtBkBy9drOEFBYPu.png", minPoints: 1000, inputLabel: "Player ID", placeholder: "Enter PUBG ID", amounts: [{ points: 5000, usd: 5 }, { points: 1000, usd: 1 }] },
      { id: "freefire", name: "Free Fire", icon: "https://earng.net/storage/images/OfIJyyst0nKyLpnm1yR12w3DUuNbhTJBIy9A3nXG.png", minPoints: 1000, inputLabel: "Player ID", placeholder: "Enter Free Fire ID", amounts: [{ points: 5000, usd: 5 }, { points: 1000, usd: 1 }] },
    ]
  }
];

export default function CashoutPage() {
  const { userData } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "withdrawals"), where("userId", "==", userData.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingHistory(false);
    }, () => setLoadingHistory(false));
    return () => unsubscribe();
  }, [userData?.uid]);

  const handleOpenWithdraw = (method: any) => {
    setSelectedMethod(method);
    setSelectedAmount(null);
    setPaymentDetails("");
    setIsModalOpen(true);
  };

  const submitWithdrawal = async () => {
    if (!userData || !selectedAmount || !paymentDetails) return toast.error("Please fill all details");
    if ((userData.points || 0) < selectedAmount.points) return toast.error("Insufficient points");

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userData.uid);
        transaction.update(userRef, { points: (userData.points || 0) - selectedAmount.points });
        const withdrawalRef = doc(collection(db, "withdrawals"));
        transaction.set(withdrawalRef, {
          userId: userData.uid,
          method: selectedMethod.name,
          pointsDeducted: selectedAmount.points,
          amountUSD: selectedAmount.usd,
          paymentDetails,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });
      toast.success("Cashout request submitted!");
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error("Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-4 md:p-8 max-w-7xl mx-auto bg-black min-h-screen text-white pb-24 font-sans">
      
      {/* Header & Balance */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
        <div className="flex-1 bg-[#0A0A0A] p-8 rounded-[2rem] border border-white/5 shadow-xl">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Redeem Rewards</h1>
          <p className="text-white/30 text-sm font-medium">Choose your preferred withdrawal method below.</p>
        </div>

        <div className="lg:w-80 bg-[#0A0A0A] p-8 rounded-[2rem] border border-[#A65FFF]/30 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-12 h-12 text-[#A65FFF]" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#A65FFF] mb-2 block">Available Balance</span>
            <div className="flex items-center gap-3">
                <img src={COIN_ICON} alt="coin" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(166,95,255,0.5)]" />
                <span className="text-5xl font-black">{(userData?.points || 0).toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Methods Grid */}
      {CASHOUT_CATEGORIES.map((cat) => (
        <div key={cat.title} className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-1.5 h-6 bg-[#A65FFF] rounded-full shadow-[0_0_15px_#A65FFF]" />
            <h2 className="text-xl font-black uppercase tracking-tight">{cat.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cat.methods.map((method) => (
              <Card 
                key={method.id} 
                onClick={() => handleOpenWithdraw(method)} 
                className="bg-[#0A0A0A] border border-white/5 rounded-[1.5rem] p-6 hover:border-[#A65FFF]/50 transition-all cursor-pointer group relative active:scale-95 flex flex-col items-center gap-4"
              >
                <img src={method.icon} alt={method.name} className="h-12 w-12 object-contain group-hover:scale-110 transition-transform duration-300" />
                <span className="font-bold text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors text-center">{method.name}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-[#A65FFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]" />
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* History Section */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center gap-3 px-2">
            <History className="w-5 h-5 text-[#A65FFF]" />
            <h2 className="text-xl font-black uppercase">Recent Withdrawals</h2>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
           {loadingHistory ? (
              <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 text-[#A65FFF] animate-spin" /></div>
           ) : (
              <div className="divide-y divide-white/[0.02]">
                 {withdrawals.length === 0 ? (
                   <div className="p-12 text-center text-white/20 font-bold uppercase tracking-widest text-xs">No withdrawal history yet</div>
                 ) : (
                   withdrawals.map((w) => (
                    <div key={w.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${w.status === 'completed' ? 'text-emerald-500 border-emerald-500/10 bg-emerald-500/5' : 'text-amber-500 border-amber-500/10 bg-amber-500/5'}`}>
                             {w.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                             <p className="font-black text-sm uppercase tracking-tight">{w.method}</p>
                             <p className="text-[10px] text-white/20 font-bold uppercase truncate max-w-[150px]">{w.paymentDetails}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end font-black text-white text-sm">
                             -{(w.pointsDeducted ?? 0).toLocaleString()} <img src={COIN_ICON} className="w-4 h-4" alt="c" />
                          </div>
                          <Badge className={`rounded-full px-3 py-1 text-[9px] uppercase mt-2 font-black ${w.status === 'completed' ? 'bg-emerald-500 text-black' : 'bg-[#A65FFF] text-white'}`}>{w.status}</Badge>
                       </div>
                    </div>
                   ))
                 )}
              </div>
           )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#111111] border border-white/5 text-white rounded-[2rem] sm:max-w-[480px] p-0 overflow-hidden shadow-2xl">
          <div className="flex justify-end p-6 pb-2">
            <button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-2 rounded-lg hover:bg-white/10 text-white/50"><X className="w-4 h-4" /></button>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <div className="flex gap-6 items-center">
              <div className="w-24 h-24 shrink-0 bg-[#0A0A0A] rounded-2xl p-5 border border-white/5 flex items-center justify-center shadow-inner">
                <img src={selectedMethod?.icon} alt="" className="max-h-full object-contain" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between text-sm border-b border-white/[0.03] pb-2">
                  <span className="text-white/40">Method</span><span className="font-black uppercase tracking-tighter">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Minimum</span>
                  <span className="font-black text-[#A65FFF] flex items-center gap-1">
                    {selectedMethod?.minPoints.toLocaleString()} <img src={COIN_ICON} className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#2A1A0A] border border-amber-500/10 p-4 rounded-2xl flex items-center gap-3">
              <Info className="w-4 h-4 text-amber-500" />
              <p className="text-[11px] font-bold text-amber-500/80 uppercase tracking-tight">Requests are processed within 24 hours.</p>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] ml-1">Select Amount</span>
              <div className="grid grid-cols-3 gap-3">
                {selectedMethod?.amounts?.map((amt: any) => (
                  <button key={amt.points} onClick={() => setSelectedAmount(amt)}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 ${selectedAmount?.points === amt.points ? 'border-[#A65FFF] bg-[#A65FFF]/10 shadow-[0_0_20px_rgba(166,95,255,0.1)]' : 'border-white/5 bg-[#0A0A0A]'}`}>
                    <span className="font-black text-lg">{amt.points.toLocaleString()}</span>
                    <span className="text-[10px] font-black text-white/30 tracking-widest">{amt.usd}$</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] ml-1">{selectedMethod?.inputLabel}</span>
              <Input 
                placeholder={selectedMethod?.placeholder} 
                value={paymentDetails} 
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="bg-[#0A0A0A] border-white/5 h-14 rounded-2xl focus:border-[#A65FFF]/50 transition-all font-bold px-5 placeholder:text-white/10" 
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/[0.03]">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total cost</span>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#00E676]">{selectedAmount ? selectedAmount.points.toLocaleString() : 0}</span>
                    <img src={COIN_ICON} className="w-6 h-6" alt="coin" />
                </div>
            </div>
          </div>

          <div className="p-4 pt-0">
            <Button className="w-full h-16 bg-[#A65FFF] hover:bg-[#914df0] text-white font-black rounded-2xl transition-all uppercase text-sm flex gap-2 shadow-2xl shadow-[#A65FFF]/20"
              onClick={submitWithdrawal} disabled={submitting || !selectedAmount || !paymentDetails}>
              {submitting ? <Loader2 className="animate-spin" /> : <><Zap className="w-4 h-4 fill-white" /> Withdraw Now</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
