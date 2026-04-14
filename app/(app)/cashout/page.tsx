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
import { Loader2, CheckCircle, Clock, History, Info, X, DollarSign, Wallet } from "lucide-react";

// Helper to convert points to USD
const pointsToUSD = (points: number) => (points / 1000).toFixed(2);

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
    if ((userData.points || 0) < selectedAmount.points) return toast.error("Insufficient balance");

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
      toast.success("Withdrawal request submitted!");
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error("Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 max-w-6xl mx-auto min-h-screen text-white pb-24">
      
      {/* Header & Balance */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4">
        <div className="flex-1 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Withdraw Funds</h1>
          <p className="text-white/40 text-sm font-medium">Choose your preferred withdrawal method below.</p>
        </div>

        <div className="lg:w-72 bg-[#0a0a0a] p-6 rounded-2xl border border-[#3B82F6]/20 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-12 h-12 text-[#3B82F6]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] mb-2 block">Available Balance</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#3B82F6]/20">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-4xl font-black">${pointsToUSD(userData?.points || 0)}</span>
          </div>
        </div>
      </div>

      {/* Methods Grid */}
      {CASHOUT_CATEGORIES.map((cat) => (
        <div key={cat.title} className="space-y-4">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1 h-5 bg-gradient-to-b from-[#3B82F6] to-[#8B5CF6] rounded-full" />
            <h2 className="text-lg font-bold">{cat.title}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {cat.methods.map((method) => (
              <Card 
                key={method.id} 
                onClick={() => handleOpenWithdraw(method)} 
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-[#3B82F6]/30 transition-all cursor-pointer group relative active:scale-[0.98] flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 p-2 flex items-center justify-center">
                  <img src={method.icon} alt={method.name} className="h-10 w-10 object-contain group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="font-bold text-[10px] uppercase tracking-wider text-white/50 group-hover:text-white transition-colors text-center">{method.name}</span>
                <span className="text-[9px] text-[#3B82F6] font-bold">Min: ${pointsToUSD(method.minPoints)}</span>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* History Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-3 px-1">
          <History className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-lg font-bold">Recent Withdrawals</h2>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
          {loadingHistory ? (
            <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" /></div>
          ) : (
            <div className="divide-y divide-white/5">
              {withdrawals.length === 0 ? (
                <div className="p-10 text-center text-white/30 font-medium text-sm">No withdrawal history yet</div>
              ) : (
                withdrawals.map((w) => (
                  <div key={w.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${w.status === 'completed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-500 border-amber-500/20 bg-amber-500/10'}`}>
                        {w.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{w.method}</p>
                        <p className="text-[10px] text-white/30 font-medium truncate max-w-[150px]">{w.paymentDetails}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end font-black text-white text-sm">
                        ${(w.amountUSD ?? 0).toFixed(2)}
                      </div>
                      <Badge className={`rounded-xl px-3 py-1 text-[9px] uppercase mt-1.5 font-bold ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {w.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal - Rectangular Design */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border border-white/10 text-white rounded-2xl sm:max-w-[440px] p-0 overflow-hidden shadow-2xl">
          <DialogTitle className="sr-only">Withdraw to {selectedMethod?.name}</DialogTitle>
          
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 p-2 flex items-center justify-center">
                <img src={selectedMethod?.icon} alt="" className="max-h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-base">{selectedMethod?.name}</h3>
                <p className="text-[10px] text-white/40 font-medium">Min: ${pointsToUSD(selectedMethod?.minPoints || 0)}</p>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-2 rounded-xl hover:bg-white/10 text-white/50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Info Banner */}
            <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-4 rounded-2xl flex items-center gap-3">
              <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />
              <p className="text-[11px] font-medium text-[#3B82F6]/80">Requests are processed within 24 hours.</p>
            </div>

            {/* Amount Selection */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-white/30 tracking-widest ml-1">Select Amount</span>
              <div className="grid grid-cols-3 gap-3">
                {selectedMethod?.amounts?.map((amt: any) => (
                  <button 
                    key={amt.points} 
                    onClick={() => setSelectedAmount(amt)}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                      selectedAmount?.points === amt.points 
                        ? 'border-[#3B82F6] bg-[#3B82F6]/10' 
                        : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    <span className="font-black text-xl">${amt.usd}</span>
                    <span className="text-[9px] font-medium text-white/30">{amt.points.toLocaleString()} pts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details Input */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-white/30 tracking-widest ml-1">{selectedMethod?.inputLabel}</span>
              <Input 
                placeholder={selectedMethod?.placeholder} 
                value={paymentDetails} 
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="bg-white/[0.02] border-white/5 h-14 rounded-2xl focus:border-[#3B82F6]/50 transition-all font-medium px-5 placeholder:text-white/20" 
              />
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">You will receive</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-[#10B981]">${selectedAmount ? selectedAmount.usd.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-5 pt-0">
            <Button 
              className="w-full h-14 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 text-white font-bold rounded-2xl transition-all text-sm flex gap-2 shadow-lg shadow-[#3B82F6]/20"
              onClick={submitWithdrawal} 
              disabled={submitting || !selectedAmount || !paymentDetails}
            >
              {submitting ? <Loader2 className="animate-spin" /> : <>Withdraw Now</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
