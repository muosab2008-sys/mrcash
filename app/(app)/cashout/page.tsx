"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  collection, doc, onSnapshot, query, where, orderBy, serverTimestamp, runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Wallet, CheckCircle, Zap, Shield, Clock, XCircle, History, Info, X } from "lucide-react";

// --- أيقونة العملة الخاصة بك ---
const COIN_ICON = "/images/c.png"; // تأكد أن المسار صحيح في مجلد public/images

// --- بيانات طرق السحب ---
const CASHOUT_CATEGORIES = [
  {
    title: "Cashout Methods",
    methods: [
      { 
        id: "paypal", name: "PayPal", currency: "USD", icon: "https://earng.net/storage/images/oipeSzxn0qPxwAFms2XGG7K8cGO5TznxhlQ8TmcL.png", 
        minPoints: 5000, glow: "blue",
        amounts: [{ points: 15000, usd: 15 }, { points: 10000, usd: 10 }, { points: 5000, usd: 5 }]
      },
      { 
        id: "visa", name: "Visa Tremendous", currency: "USD", icon: "https://earng.net/storage/images/b7e5Ish9TrqPixjxgUXjGIZfAizgbxivJTLm9Nhq.png", 
        minPoints: 5000, glow: "white",
        amounts: [{ points: 25000, usd: 25 }, { points: 10000, usd: 10 }, { points: 5000, usd: 5 }]
      },
    ]
  },
  {
    title: "Crypto",
    methods: [
      { 
        id: "faucetpay", name: "FaucetPay", currency: "USDT/BTC", icon: "https://earng.net/storage/temp-images/niLsNzBAPnZvq2XFAijzOc5fEXOFN0Fh1QKaE5Wv.png", 
        minPoints: 1000, glow: "blue",
        amounts: [{ points: 10000, usd: 10 }, { points: 5000, usd: 5 }, { points: 1000, usd: 1 }]
      },
      { 
        id: "binance", name: "Binance", currency: "USDT", icon: "https://earng.net/storage/images/ZweowA5mo9MrohnCYKI3VkCfJGZwbVLBbH24QUXU.png", 
        minPoints: 10000, glow: "yellow",
        amounts: [{ points: 50000, usd: 50 }, { points: 20000, usd: 20 }, { points: 10000, usd: 10 }]
      },
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
    if (!userData || !selectedAmount || !paymentDetails) return toast.error("الرجاء إكمال البيانات");
    if ((userData.points || 0) < selectedAmount.points) return toast.error("نقاطك غير كافية");

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
      toast.success("تم إرسال الطلب بنجاح!");
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-12 p-4 md:p-8 max-w-7xl mx-auto bg-black min-h-screen text-white pb-24">
      
      {/* 1. الترويسة ورصيد المستخدم */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
        <div className="flex-1 bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Redeem Rewards</h1>
          <p className="text-white/30 text-sm font-medium">اختر وسيلة السحب المفضلة لديك لتحويل نقاطك إلى أموال.</p>
          <div className="flex gap-3 mt-6">
            <Badge className="bg-[#A65FFF]/10 text-[#A65FFF] border-[#A65FFF]/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Safe & Secure</Badge>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Fast Payouts</Badge>
          </div>
        </div>

        <div className="lg:w-80 bg-gradient-to-br from-[#A65FFF]/20 to-[#0A0A0A] p-8 rounded-[2.5rem] border border-[#A65FFF]/30 flex flex-col justify-center shadow-[0_0_50px_rgba(166,95,255,0.1)]">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A65FFF] mb-2 block">Available Balance</span>
            <div className="flex items-center gap-3">
                <img src={COIN_ICON} alt="coin" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_#A65FFF]" />
                <span className="text-5xl font-black tracking-tighter">{(userData?.points || 0).toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* 2. طرق السحب */}
      {CASHOUT_CATEGORIES.map((cat) => (
        <div key={cat.title} className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-1.5 h-6 bg-[#A65FFF] rounded-full shadow-[0_0_10px_#A65FFF]" />
            <h2 className="text-xl font-black uppercase tracking-tighter">{cat.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {cat.methods.map((method) => (
              <Card 
                key={method.id}
                onClick={() => handleOpenWithdraw(method)}
                className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 hover:border-[#A65FFF]/40 transition-all duration-500 cursor-pointer group relative overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="flex flex-col items-center gap-6 relative z-10">
                  <img src={method.icon} alt={method.name} className="h-12 object-contain grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500" />
                  <span className="font-black text-[11px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{method.name}</span>
                </div>
                <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-30 transition-all duration-500 bg-[#A65FFF]`} />
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* 3. سجل السحوبات */}
      <div className="mt-10 space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[#A65FFF]" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Withdrawal History</h2>
           </div>
        </div>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
           {loadingHistory ? (
              <div className="p-20 flex flex-col items-center gap-4 text-white/20 uppercase font-black text-[10px] tracking-widest">
                 <Loader2 className="w-8 h-8 text-[#A65FFF] animate-spin" />
                 Loading history...
              </div>
           ) : withdrawals.length === 0 ? (
              <div className="p-20 flex flex-col items-center gap-4 opacity-20 uppercase font-black text-[10px] tracking-widest">
                 <History className="w-12 h-12" />
                 No records found
              </div>
           ) : (
              <div className="divide-y divide-white/[0.03]">
                 {withdrawals.map((w) => (
                    <div key={w.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${w.status === 'completed' ? 'text-emerald-500 border-emerald-500/20' : w.status === 'rejected' ? 'text-red-500 border-red-500/20' : 'text-[#A65FFF] border-[#A65FFF]/20'}`}>
                             {w.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : w.status === 'rejected' ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                             <p className="font-black text-sm uppercase tracking-tight">{w.method}</p>
                             <p className="text-[10px] font-bold text-white/20 uppercase mt-0.5">{w.createdAt?.toDate().toLocaleDateString()} • {w.paymentDetails}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <div className="flex items-center gap-1.5 justify-end">
                                <span className="font-black text-sm text-white">-{(w.pointsDeducted ?? 0).toLocaleString()}</span>
                                <img src={COIN_ICON} className="w-3 h-3" alt="c" />
                             </div>
                             <p className="text-[10px] font-bold text-emerald-500 uppercase mt-0.5">+${w.amountUSD || (w.pointsDeducted / 1000)}</p>
                          </div>
                          <Badge className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase border-none ${w.status === 'completed' ? 'bg-emerald-500 text-black' : w.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-[#A65FFF] text-white'}`}>
                             {w.status}
                          </Badge>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* 4. الـ Modal الاحترافي المحدث */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#111111] border border-white/5 text-white rounded-[2rem] sm:max-w-[480px] p-0 overflow-hidden shadow-[0_0_100px_rgba(166,95,255,0.1)]">
          <div className="flex justify-end p-6 pb-2">
            <button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 pb-6 space-y-6">
            <div className="flex gap-6 items-start">
              <div className="w-24 h-24 shrink-0 bg-[#0A0A0A] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center relative">
                <img src={selectedMethod?.icon} alt="" className="max-h-12 object-contain mb-2" />
                <span className="font-bold text-[10px] text-[#A65FFF] uppercase">{selectedMethod?.name}</span>
                <div className="absolute bottom-0 w-full h-1 bg-[#A65FFF] blur-sm opacity-20" />
              </div>

              <div className="flex-1 space-y-3 pt-1 text-sm">
                <div className="flex justify-between pb-2 border-b border-white/[0.03]"><span className="text-white/40">Name</span><span className="font-bold">{selectedMethod?.name}</span></div>
                <div className="flex justify-between pb-2 border-b border-white/[0.03]"><span className="text-white/40">Currency</span><span className="font-bold">{selectedMethod?.currency}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Minimum</span><span className="font-bold text-[#A65FFF]">{selectedMethod?.minPoints.toLocaleString()} points</span></div>
              </div>
            </div>

            <div className="bg-[#2A1A0A] border border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500"><Info className="w-4 h-4" /></div>
              <p className="text-[11px] font-bold text-amber-500/90 leading-tight">سيتم مراجعة طلبك وإرسال الأموال في غضون 24 ساعة كحد أقصى.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-white/30 tracking-widest">Select Amount</h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedMethod?.amounts?.map((amt: any) => (
                  <button key={amt.points} onClick={() => setSelectedAmount(amt)}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1 hover:-translate-y-1 ${selectedAmount?.points === amt.points ? 'border-[#A65FFF] bg-[#A65FFF]/10 shadow-[0_0_20px_rgba(166,95,255,0.1)]' : 'border-white/5 bg-[#0A0A0A]'}`}>
                    <span className="font-black text-lg tracking-tighter">{amt.points.toLocaleString()}</span>
                    <span className={`text-[10px] font-black uppercase ${selectedAmount?.points === amt.points ? 'text-[#A65FFF]' : 'text-white/20'}`}>{amt.usd}$</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-white/30 tracking-widest ml-1">Wallet Details</label>
              <Input placeholder={`Enter your ${selectedMethod?.name} address`} value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)}
                className="bg-[#0A0A0A] border-white/5 h-14 rounded-2xl focus:border-[#A65FFF]/50 transition-all font-bold text-sm px-5" />
            </div>

            <div className="flex justify-between items-center text-sm pt-4 border-t border-white/[0.03]">
                <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Total Withdrawal</span>
                <div className="flex items-center gap-2">
                    <span className="text-[#00E676] font-black text-xl tracking-tighter">{selectedAmount ? selectedAmount.points.toLocaleString() : 0}</span>
                    <img src={COIN_ICON} className="w-5 h-5" alt="c" />
                </div>
            </div>
          </div>

          <div className="p-3">
            <Button className="w-full h-16 bg-[#A65FFF] hover:bg-[#914df0] text-white font-black rounded-2xl transition-all uppercase text-sm flex gap-2 shadow-[0_10px_30px_rgba(166,95,255,0.2)]"
              onClick={submitWithdrawal} disabled={submitting || !selectedAmount || !paymentDetails}>
              {submitting ? <Loader2 className="animate-spin" /> : <><Zap className="w-4 h-4 fill-white" /> Request Withdrawal</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
