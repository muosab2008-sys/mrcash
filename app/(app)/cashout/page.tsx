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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Wallet, Clock, CheckCircle, XCircle, Loader2, 
  Gift, Bitcoin, Gamepad2, CreditCard, Landmark, DollarSign, Coins 
} from "lucide-react";
import Image from "next/image";

// --- بيانات طرق السحب بناءً على الصور ---
const CASHOUT_METHODS = [
  { id: "paypal", name: "PayPal", category: "Cashout Methods", icon: "/paypal.png", minPoints: 5000, glow: "blue" },
  { id: "visa", name: "Visa Tremendous", category: "Cashout Methods", icon: "/visa.png", minPoints: 5000, glow: "white" },
  { id: "amazon", name: "Amazon US", category: "Gift Cards", icon: "/amazon.png", minPoints: 2000, glow: "orange" },
  { id: "google", name: "Google Play US", category: "Gift Cards", icon: "/google-play.png", minPoints: 5000, glow: "green" },
  { id: "faucetpay", name: "FaucetPay", category: "Crypto", icon: "/faucetpay.png", minPoints: 1000, glow: "blue" },
  { id: "binance", name: "Binance", category: "Crypto", icon: "/binance.png", minPoints: 10000, glow: "yellow" },
  { id: "freefire", name: "Free Fire", category: "Skins", icon: "/freefire.png", minPoints: 1000, glow: "purple" },
  { id: "pubg", name: "PUBG Mobile", category: "Skins", icon: "/pubg.png", minPoints: 1000, glow: "yellow" },
];

export default function CashoutPage() {
  const { userData } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // حالات الـ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState("");

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "withdrawals"), where("userId", "==", userData.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));
  }, [userData?.uid]);

  const handleOpenWithdraw = (method: any) => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  const submitWithdrawal = async () => {
    if (!userData || !paymentDetails) {
      toast.error("Please enter your details");
      return;
    }
    if ((userData.points || 0) < selectedMethod.minPoints) {
      toast.error(`Minimum withdrawal is ${selectedMethod.minPoints} points`);
      return;
    }

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userData.uid);
        transaction.update(userRef, { points: (userData.points || 0) - selectedMethod.minPoints });
        const withdrawalRef = doc(collection(db, "withdrawals"));
        transaction.set(withdrawalRef, {
          userId: userData.uid,
          username: userData.username,
          email: userData.email,
          method: selectedMethod.name,
          pointsDeducted: selectedMethod.minPoints,
          amountUSD: selectedMethod.minPoints / 1000,
          paymentDetails,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });
      toast.success("Request sent successfully!");
      setIsModalOpen(false);
      setPaymentDetails("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-6 pb-20 px-4 min-h-screen bg-[#050505]">
      
      {/* 1. Header & Balance - تصميم مستوحى من الصور */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-[#0D0D0D] border-white/5 relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
          <CardContent className="p-6 flex items-center gap-5 relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
              <Coins className="text-white h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Available Points</p>
              <p className="text-3xl font-black text-white tracking-tighter">{(userData?.points || 0).toLocaleString()} <span className="text-xs text-white/30 font-bold">PTS</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0D0D0D] border-[#A65FFF]/20 relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(166,95,255,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#A65FFF]/[0.02] to-transparent pointer-events-none" />
          <CardContent className="p-6 flex items-center gap-5 relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A65FFF]/10 border border-[#A65FFF]/20">
              <DollarSign className="text-[#A65FFF] h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] text-[#A65FFF]/40 font-black uppercase tracking-[0.2em] mb-1">Estimated Value</p>
              <p className="text-3xl font-black text-[#A65FFF] tracking-tighter">${((userData?.points || 0) / 1000).toFixed(2)} <span className="text-xs text-[#A65FFF]/30 font-bold">USD</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. الأقسام وطرق السحب - تصميم مضيء */}
      {["Cashout Methods", "Gift Cards", "Crypto", "Skins"].map((cat) => (
        <div key={cat} className="space-y-5">
          <div className="flex items-center gap-3">
             <div className="h-9 w-1 bg-gradient-to-b from-cyan-400 via-[#A65FFF] to-cyan-400 rounded-full" />
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{cat}</h2>
             <Badge className="bg-white/5 text-white/30 border-white/10 ml-2">{CASHOUT_METHODS.filter(m => m.category === cat).length} Options</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {CASHOUT_METHODS.filter(m => m.category === cat).map((method) => (
              <Card 
                key={method.id} 
                onClick={() => handleOpenWithdraw(method)}
                className={`bg-[#0D0D0D] border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer group relative overflow-hidden active:scale-95
                  ${method.glow === 'blue' ? 'hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.2)]' : ''}
                  ${method.glow === 'yellow' ? 'hover:shadow-[0_20px_50px_-15px_rgba(234,179,8,0.2)]' : ''}
                  ${method.glow === 'orange' ? 'hover:shadow-[0_20px_50px_-15px_rgba(249,115,22,0.2)]' : ''}
                  ${method.glow === 'purple' ? 'hover:shadow-[0_20px_50px_-15px_rgba(166,95,255,0.2)]' : ''}
                  ${method.glow === 'white' ? 'hover:shadow-[0_20px_50px_-15px_rgba(255,255,255,0.1)]' : ''}
                `}
              >
                <CardContent className="p-8 flex flex-col items-center gap-5">
                  <div className="h-16 w-full relative flex items-center justify-center transition-all duration-500">
                    {/* تأكد من وجود ملفات الصور في مجلد public بأسماء صحيحة */}
                    <img src={method.icon} alt={method.name} className="object-contain h-14 w-full" />
                  </div>
                  <p className="font-black text-[13px] text-white uppercase tracking-tight text-center">{method.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* 3. نافذة تأكيد السحب (Modal) - تصميم مركزي */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white rounded-[2.5rem] sm:max-w-md mx-4 shadow-[0_30px_70px_rgba(0,0,0,0.8)]">
          <DialogHeader className="flex flex-col items-center gap-5">
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] p-5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-[#A65FFF]/10 blur-xl group-hover:blur-2xl transition-all" />
              <img src={selectedMethod?.icon} alt="" className="object-contain relative z-10 h-full w-full" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Confirmation</DialogTitle>
            <DialogDescription className="text-white/40 text-xs text-center font-bold px-4">
              Deduction: <span className="text-[#E366FF]">{selectedMethod?.minPoints.toLocaleString()} PTS</span> (~${(selectedMethod?.minPoints / 1000).toFixed(2)} USD)
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 px-2 space-y-4">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Wallet / Account Details</label>
              <Input 
                placeholder={selectedMethod?.id === 'paypal' ? 'PayPal Email Address' : 'Wallet ID / Username'}
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="bg-black border border-white/5 h-16 rounded-2xl focus:ring-2 focus:ring-[#A65FFF]/50 transition-all text-sm font-bold text-white px-5"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 pb-4">
            <Button 
              className="w-full h-16 bg-gradient-to-r from-cyan-400 via-[#A65FFF] to-cyan-400 text-white font-black rounded-2xl shadow-[0_10px_25px_rgba(166,95,255,0.3)] hover:opacity-90 active:scale-95 transition-all text-xs border-none"
              onClick={submitWithdrawal}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="animate-spin" /> : "REQUEST CASHOUT"}
            </Button>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-white/20 text-[11px] font-bold uppercase hover:bg-transparent hover:text-white">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
