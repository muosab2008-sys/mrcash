"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { 
  db, 
  doc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  runTransaction 
} from "@/lib/firebase";
import { 
  Wallet, 
  CreditCard, 
  Loader2, 
  X, 
  Coins, 
  ArrowRightLeft, 
  Mail, 
  Hash, 
  ShieldCheck, 
  Trophy,
  AlertCircle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { toast } from "sonner";

// 1. مصفوفة وسائل السحب مع الروابط التي زودتني بها
const withdrawMethods = [
  { id: "binance", label: "Binance (USDT)", min: 1000, image: "https://earng.net/storage/images/ZweowA5mo9MrohnCYKI3VkCfJGZwbVLBbH24QUXU.png", type: "ID", placeholder: "Enter your Binance UID" },
  { id: "faucetpay", label: "FaucetPay", min: 500, image: "https://earng.net/storage/temp-images/niLsNzBAPnZvq2XFAijzOc5fEXOFN0Fh1QKaE5Wv.png", type: "Email", placeholder: "Enter FaucetPay Email" },
  { id: "cwallet", label: "C-Wallet", min: 500, image: "https://earng.net/storage/images/CVMa2olhLqSdi0DhCsurT7qVZNzubx0Bv6yjaWE7.png", type: "ID", placeholder: "Enter your C-Wallet ID" },
  { id: "visa", label: "Visa Card", min: 5000, image: "https://earng.net/storage/images/b7e5Ish9TrqPixjxgUXjGIZfAizgbxivJTLm9Nhq.png", type: "Email", placeholder: "Delivery Email Address" },
  { id: "paypal", label: "PayPal Cash", min: 2000, image: "https://earng.net/storage/images/oipeSzxn0qPxwAFms2XGG7K8cGO5TznxhlQ8TmcL.png", type: "Email", placeholder: "Enter PayPal Email" },
  { id: "google_play", label: "Google Play (US)", min: 1000, image: "https://earng.net/storage/images/cR9c5tKppt6nWks7U1WS2Hp2S10zX6gPHMEuYPII.png", type: "Email", placeholder: "Delivery Email Address" },
  { id: "amazon", label: "Amazon Card (US)", min: 1000, image: "https://earng.net/storage/images/HjLzhYmDg1Kul5979jLDii0BCfiQdE8Z2fzaLFWT.png", type: "Email", placeholder: "Delivery Email Address" },
  { id: "itunes", label: "iTunes Apple", min: 1000, image: "https://earng.net/storage/images/fEtLXen6YAH82wW1uS5osza3t1APXcKINWrCOixH.png", type: "Email", placeholder: "Delivery Email Address" },
  { id: "freefire", label: "Free Fire Gems", min: 1000, image: "https://earng.net/storage/images/OfIJyyst0nKyLpnm1yR12w3DUuNbhTJBIy9A3nXG.png", type: "ID", placeholder: "Enter Player ID" },
  { id: "pubg", label: "PUBG Mobile UC", min: 1000, image: "https://earng.net/storage/temp-images/33d2d2cjBBy67mkJkMPfREmBUtBkBy9drOEFBYPu.png", type: "ID", placeholder: "Enter Character ID" },
];

export function WithdrawPage() {
  const { user, balance } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );

  const numAmount = parseInt(amount) || 0;
  // شرط السحب: وجود وسيلة مختارة + النقاط أكبر من الحد الأدنى + النقاط أقل من الرصيد الحالي + إدخال الحساب
  const canWithdraw = selectedMethod && numAmount >= selectedMethod.min && numAmount <= balance && account.length > 5;

  const handleWithdraw = async () => {
    if (!canWithdraw) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      // عملية Transaction لخصم الرصيد بأمان من قاعدة البيانات
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User record not found.");
        const currentBalance = userDoc.data().balance || 0;
        if (currentBalance < numAmount) throw new Error("Insufficient points.");
        transaction.update(userRef, { balance: currentBalance - numAmount });
      });

      // إضافة الطلب إلى مجموعة السحب
      await addDoc(collection(db, "withdraw_requests"), {
        userId: user.uid,
        userEmail: user.email,
        displayName: user.displayName || "User",
        paymentMethod: selectedMethod.label,
        accountDetails: account,
        points: numAmount,
        dollarValue: (numAmount / 1000).toFixed(2), // مثال: كل 1000 نقطة تساوي 1 دولار
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast.success("Withdrawal request submitted! Our team will audit it soon.");
      setAmount("");
      setAccount("");
      setSelectedMethod(null);
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Rewards Store</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
            Cash <span className="text-primary">Out</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl">
            Redeem your points for real cash or digital gift cards. Safe, fast, and secure.
          </p>
        </div>

        {/* كرت عرض الرصيد الحالي */}
        <div className="bg-card border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 relative overflow-hidden group min-w-[300px]">
            <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 blur-3xl rounded-full -mr-10 -mt-10" />
            <div className="relative flex items-center gap-6">
                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                    <Coins className="h-8 w-8" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Available Points</p>
                    <p className="text-4xl font-black text-foreground mt-1 tracking-tighter">{balance.toLocaleString()}</p>
                </div>
            </div>
        </div>
      </div>

      {/* شريط الأمان */}
      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="bg-white p-3 rounded-2xl shadow-sm hidden sm:block">
              <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="text-left">
              <p className="text-sm font-black text-foreground uppercase tracking-tight">Withdrawal Security Audit</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">All requests are manually reviewed within 24-48 hours to ensure system integrity.</p>
          </div>
      </div>

      {/* شبكة وسائل السحب */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {withdrawMethods.map((pm) => (
          <button
            key={pm.id}
            onClick={() => setSelectedMethod(pm)}
            className="group relative flex flex-col items-center bg-card border-2 border-border rounded-[3rem] p-8 transition-all duration-500 hover:border-primary hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-20 w-20 bg-primary/5 blur-2xl group-hover:bg-primary/20 transition-all" />
            
            <div className="h-24 w-full flex items-center justify-center mb-6">
              <img src={pm.image} alt={pm.label} className="max-h-full max-w-full object-contain filter group-hover:scale-110 transition-transform duration-500" />
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-sm font-black text-foreground uppercase tracking-tighter leading-tight h-10 flex items-center">{pm.label}</h3>
              <div className="inline-block px-4 py-1.5 bg-secondary rounded-full border border-border">
                <p className="text-[10px] text-primary font-black uppercase">From {pm.min} PT</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* نافذة السحب (Modal) */}
      {selectedMethod && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-card border-2 border-border rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-500">
            
            {/* رأس النافذة */}
            <div className="p-8 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-border">
                  <img src={selectedMethod.image} className="h-12 w-12 object-contain" alt="" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-2xl text-foreground uppercase tracking-tighter">{selectedMethod.label}</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Secure Request</p>
                </div>
              </div>
              <button onClick={() => setSelectedMethod(null)} className="p-3 hover:bg-destructive/10 hover:text-destructive rounded-2xl transition-all"><X className="h-8 w-8" /></button>
            </div>

            {/* محتوى النافذة */}
            <div className="p-10 space-y-10 text-left">
              
              {/* حقل العنوان/الحساب */}
              <div className="space-y-4">
                <label className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                   {selectedMethod.type === "ID" ? <Hash className="h-4 w-4 text-primary" /> : <Mail className="h-4 w-4 text-primary" />}
                   {selectedMethod.type === "ID" ? "Player ID / Account ID" : "Recipient Email Address"}
                </label>
                <input
                  type="text"
                  placeholder={selectedMethod.placeholder}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full bg-secondary/50 border-2 border-border rounded-2xl px-6 py-5 text-lg font-bold focus:border-primary focus:bg-background outline-none transition-all shadow-inner"
                />
              </div>

              {/* حقل كمية النقاط */}
              <div className="space-y-4">
                <label className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  Points to Redeem
                </label>
                <div className="relative">
                    <input
                      type="number"
                      placeholder={`Min: ${selectedMethod.min}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-secondary/50 border-2 border-border rounded-2xl px-6 py-5 text-lg font-bold focus:border-primary focus:bg-background outline-none transition-all shadow-inner"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs font-black text-muted-foreground uppercase">MC Points</span>
                    </div>
                </div>
                {/* حاسبة القيمة التقريبية */}
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] font-bold text-muted-foreground italic">Balance: {balance.toLocaleString()} PT</p>
                    {numAmount > 0 && (
                        <div className="flex items-center gap-2 text-primary font-black">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-sm uppercase tracking-tighter">You will get: ${(numAmount / 1000).toFixed(2)}</span>
                        </div>
                    )}
                </div>
              </div>

              {/* زر التأكيد */}
              <button
                onClick={handleWithdraw}
                disabled={!canWithdraw || loading}
                className="w-full bg-primary text-primary-foreground rounded-[2rem] py-6 font-black text-xl shadow-2xl shadow-primary/30 hover:brightness-110 transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-4 uppercase tracking-tighter"
              >
                {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : (
                  <>
                    Confirm Withdrawal
                    <ArrowRightLeft className="h-6 w-6 rotate-90" />
                  </>
                )}
              </button>
            </div>

            {/* فوتر النافذة */}
            <div className="bg-secondary/30 p-6 flex justify-center border-t border-border">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <Lock className="h-3 w-3" /> Encrypted Transaction Node: {user.uid.substring(0, 10)}
                </p>
            </div>
          </div>
        </div>
      )}
      
      {/* فوتر الصفحة */}
      <footer className="pt-20 pb-10 border-t border-border/50 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-4 opacity-30 grayscale grayscale-0 hover:grayscale-0 transition-all">
             <img src="https://earng.net/storage/images/ZweowA5mo9MrohnCYKI3VkCfJGZwbVLBbH24QUXU.png" className="h-6 w-auto" alt="" />
             <div className="h-1 w-1 bg-muted-foreground rounded-full" />
             <img src="https://earng.net/storage/images/b7e5Ish9TrqPixjxgUXjGIZfAizgbxivJTLm9Nhq.png" className="h-6 w-auto" alt="" />
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.5em]">Mr Cash • Reward Distribution Node</p>
      </footer>
    </div>
  );
}
