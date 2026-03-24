"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, DollarSign, Wallet, CheckCircle, Zap, Shield, Clock, XCircle, History } from "lucide-react";

// --- البيانات والروابط المباشرة ---
const CASHOUT_CATEGORIES = [
  {
    title: "Cashout Methods",
    icon: <Wallet className="w-5 h-5 text-[#A65FFF]" />,
    methods: [
      { id: "paypal", name: "PayPal", icon: "https://earng.net/storage/images/oipeSzxn0qPxwAFms2XGG7K8cGO5TznxhlQ8TmcL.png", minPoints: 5000, glow: "blue" },
      { id: "visa", name: "Visa Tremendous", icon: "https://earng.net/storage/images/b7e5Ish9TrqPixjxgUXjGIZfAizgbxivJTLm9Nhq.png", minPoints: 5000, glow: "white" },
    ]
  },
  {
    title: "Crypto",
    icon: <div className="p-1 bg-amber-500 rounded-full"><DollarSign className="w-4 h-4 text-white" /></div>,
    methods: [
      { id: "faucetpay", name: "FaucetPay", icon: "https://earng.net/storage/temp-images/niLsNzBAPnZvq2XFAijzOc5fEXOFN0Fh1QKaE5Wv.png", minPoints: 1000, glow: "blue" },
      { id: "binance", name: "Binance", icon: "https://earng.net/storage/images/ZweowA5mo9MrohnCYKI3VkCfJGZwbVLBbH24QUXU.png", minPoints: 10000, glow: "yellow" },
      { id: "litecoin", name: "Litecoin", icon: "https://earng.net/storage/images/c2YcgB4WR4QIpNjZWXULqMcthmyUQHKMg9o1Wnl6.png", minPoints: 1000, glow: "blue" },
      { id: "cwallet", name: "cWallet", icon: "https://earng.net/storage/images/CVMa2olhLqSdi0DhCsurT7qVZNzubx0Bv6yjaWE7.png", minPoints: 1000, glow: "green" },
    ]
  },
  {
    title: "Gift Cards",
    icon: <Zap className="w-5 h-5 text-orange-400" />,
    methods: [
      { id: "amazon", name: "Amazon", icon: "https://earng.net/storage/images/HjLzhYmDg1Kul5979jLDii0BCfiQdE8Z2fzaLFWT.png", minPoints: 2000, glow: "orange" },
      { id: "google", name: "Google Play US", icon: "https://earng.net/storage/images/cR9c5tKppt6nWks7U1WS2Hp2S10zX6gPHMEuYPII.png", minPoints: 5000, glow: "green" },
      { id: "itunes", name: "iTunes Apple", icon: "https://earng.net/storage/images/fEtLXen6YAH82wW1uS5osza3t1APXcKINWrCOixH.png", minPoints: 5000, glow: "blue" },
    ]
  },
  {
    title: "Skins",
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
    methods: [
      { id: "pubg", name: "PUBG Mobile", icon: "https://earng.net/storage/temp-images/33d2d2cjBBy67mkJkMPfREmBUtBkBy9drOEFBYPu.png", minPoints: 1000, glow: "yellow" },
      { id: "freefire", name: "Free Fire", icon: "https://earng.net/storage/images/OfIJyyst0nKyLpnm1yR12w3DUuNbhTJBIy9A3nXG.png", minPoints: 1000, glow: "purple" },
    ]
  }
];

export default function CashoutPage() {
  const { userData } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // جلب سجل السحوبات من Firebase
  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(db, "withdrawals"), 
      where("userId", "==", userData.uid), 
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingHistory(false);
    }, () => setLoadingHistory(false));
    return () => unsubscribe();
  }, [userData?.uid]);

  const handleOpenWithdraw = (method: any) => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  const submitWithdrawal = async () => {
    if (!userData || !paymentDetails) return toast.error("Please enter your details");
    if ((userData.points || 0) < selectedMethod.minPoints) return toast.error("Insufficient points");

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userData.uid);
        transaction.update(userRef, { points: (userData.points || 0) - selectedMethod.minPoints });
        const withdrawalRef = doc(collection(db, "withdrawals"));
        transaction.set(withdrawalRef, {
          userId: userData.uid,
          method: selectedMethod.name,
          pointsDeducted: selectedMethod.minPoints,
          paymentDetails,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });
      toast.success("Withdrawal request sent!");
      setIsModalOpen(false);
      setPaymentDetails("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 max-w-7xl mx-auto bg-black min-h-screen text-white pb-24">
      
      {/* 1. الترويسة العلوية ورصيد المستخدم */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
        <div className="flex-1 bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-white/5">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Redeem Rewards</h1>
          <p className="text-white/30 text-sm font-medium">Select a payment method to cash out your earned points.</p>
          <div className="flex gap-3 mt-6">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Safe & Secure</Badge>
            <Badge className="bg-[#A65FFF]/10 text-[#A65FFF] border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Fast Payouts</Badge>
          </div>
        </div>

        <div className="lg:w-80 bg-gradient-to-br from-[#A65FFF]/20 to-black p-8 rounded-[2.5rem] border border-[#A65FFF]/20 flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A65FFF] mb-2 block">Your Balance</span>
            <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter">{(userData?.points || 0).toLocaleString()}</span>
                <span className="text-white/20 font-bold text-sm uppercase">PTS</span>
            </div>
        </div>
      </div>

      {/* 2. عرض المربعات (طرق السحب) */}
      {CASHOUT_CATEGORIES.map((cat) => (
        <div key={cat.title} className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-1 h-6 bg-[#A65FFF] rounded-full" />
            <h2 className="text-xl font-black uppercase tracking-tighter">{cat.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {cat.methods.map((method) => (
              <Card 
                key={method.id}
                onClick={() => handleOpenWithdraw(method)}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 hover:border-[#A65FFF]/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                <div className="flex flex-col items-center gap-6 relative z-10">
                  <img src={method.icon} alt={method.name} className="h-12 object-contain grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500" />
                  <span className="font-black text-[11px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{method.name}</span>
                </div>
                {/* Glow Effect */}
                <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-40 transition-all duration-500
                   ${method.glow === 'blue' ? 'bg-blue-500' : ''}
                   ${method.glow === 'yellow' ? 'bg-amber-400' : ''}
                   ${method.glow === 'orange' ? 'bg-orange-500' : ''}
                   ${method.glow === 'green' ? 'bg-emerald-500' : ''}
                   ${method.glow === 'purple' ? 'bg-purple-500' : ''}
                   ${method.glow === 'white' ? 'bg-white' : ''}
                `} />
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* 3. سجل السحوبات (Withdrawal History) */}
      <div className="mt-10 space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-white/40" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Withdrawal History</h2>
           </div>
           {withdrawals.length > 0 && <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{withdrawals.length} Total Requests</span>}
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden">
           {loadingHistory ? (
              <div className="p-20 flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 text-[#A65FFF] animate-spin" />
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Loading history...</p>
              </div>
           ) : withdrawals.length === 0 ? (
              <div className="p-20 flex flex-col items-center gap-4 opacity-20">
                 <History className="w-12 h-12" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-center">No withdrawal records found</p>
              </div>
           ) : (
              <div className="divide-y divide-white/[0.03]">
                 {withdrawals.map((w) => (
                    <div key={w.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                             w.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                             w.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                             'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                             {w.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : 
                              w.status === 'rejected' ? <XCircle className="w-6 h-6" /> : 
                              <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                             <p className="font-black text-sm uppercase tracking-tight">{w.method}</p>
                             <p className="text-[10px] font-bold text-white/20 uppercase mt-0.5">
                                {w.createdAt?.toDate().toLocaleDateString()} • {w.paymentDetails}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center justify-between md:justify-end gap-6">
                          <div className="text-right">
                             <p className="font-black text-sm text-white tracking-tighter">-{(w.pointsDeducted ?? 0).toLocaleString()} <span className="text-[10px] text-white/30">PTS</span></p>
                             <p className="text-[10px] font-bold text-emerald-500 uppercase mt-0.5">+${(w.pointsDeducted / 1000).toFixed(2)}</p>
                          </div>
                          <Badge className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-none ${
                             w.status === 'completed' ? 'bg-emerald-500 text-black' : 
                             w.status === 'rejected' ? 'bg-red-500 text-white' : 
                             'bg-amber-500 text-black'
                          }`}>
                             {w.status}
                          </Badge>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* 4. Modal السحب */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white rounded-[2.5rem] sm:max-w-md shadow-2xl">
           <DialogHeader className="flex flex-col items-center pt-6">
            <div className="w-20 h-20 bg-white/5 rounded-3xl p-4 border border-white/10 flex items-center justify-center mb-4">
              <img src={selectedMethod?.icon} alt="" className="max-h-full object-contain" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Confirm Cashout</DialogTitle>
            <DialogDescription className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
              Cost: {selectedMethod?.minPoints.toLocaleString()} Points
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Wallet Address / ID</label>
              <Input 
                placeholder="Enter details here..."
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="bg-black border-white/5 h-14 rounded-2xl focus:border-[#A65FFF]/50 transition-all font-bold"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex flex-col gap-3">
            <Button 
              className="w-full h-14 bg-[#A65FFF] hover:bg-[#914df0] text-white font-black rounded-2xl transition-all uppercase text-xs"
              onClick={submitWithdrawal}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin" /> : "Request Withdrawal"}
            </Button>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-white/20 text-[10px] font-black uppercase hover:bg-transparent hover:text-white">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
