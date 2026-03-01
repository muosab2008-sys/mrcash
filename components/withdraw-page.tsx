"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import {
  db,
  doc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from "@/lib/firebase";
import {
  Wallet,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  Coins,
  Gift,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";

// تعريف طرق الدفع مع الشعارات الحقيقية والحدود التي طلبتها
const paymentMethods = [
  { 
    id: "paypal", 
    label: "PayPal", 
    min: 5000, 
    max: 50000, 
    image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg", 
    color: "bg-blue-50", 
    type: "wallet" 
  },
  { 
    id: "binance", 
    label: "Binance (USDT)", 
    min: 100, 
    max: 10000, 
    image: "https://upload.wikimedia.org/wikipedia/commons/1/12/Binance_logo.svg", 
    color: "bg-yellow-50", 
    type: "wallet" 
  },
  { 
    id: "faucetpay", 
    label: "FaucetPay", 
    min: 50, 
    max: 5000, 
    image: "https://faucetpay.io/static/images/favicon.png", 
    color: "bg-indigo-50", 
    type: "wallet" 
  },
  { 
    id: "cwallet", 
    label: "C-Wallet", 
    min: 50, 
    max: 5000, 
    image: "https://c-wallet.com/images/logo-icon.png", 
    color: "bg-cyan-50", 
    type: "wallet" 
  },
  { 
    id: "google_play", 
    label: "Google Play", 
    min: 1000, 
    max: 10000, 
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_google_play_p_logo.png", 
    color: "bg-green-50", 
    type: "gift" 
  },
  { 
    id: "amazon", 
    label: "Amazon Gift", 
    min: 1000, 
    max: 10000, 
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg", 
    color: "bg-orange-50", 
    type: "gift" 
  },
  { 
    id: "freefire", 
    label: "Free Fire Gems", 
    min: 1000, 
    max: 10000, 
    image: "https://upload.wikimedia.org/wikipedia/en/3/36/Garena_Free_Fire_logo.png", 
    color: "bg-red-50", 
    type: "gift" 
  },
  { 
    id: "pubg", 
    label: "PUBG UC", 
    min: 1000, 
    max: 10000, 
    image: "https://w7.pngwing.com/pngs/351/799/png-transparent-pubg-mobile-logo-thumbnail.png", 
    color: "bg-orange-50", 
    type: "gift" 
  },
];

export function WithdrawPage() {
  const { user, balance } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const numAmount = parseInt(amount) || 0;
  const canWithdraw = selectedMethod && numAmount >= selectedMethod.min && numAmount <= balance && account.length > 2;

  const handleWithdraw = async () => {
    if (!canWithdraw) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("المستخدم غير موجود");
        const currentBalance = userDoc.data().balance || 0;
        if (currentBalance < numAmount) throw new Error("رصيدك غير كافٍ");
        transaction.update(userRef, { balance: currentBalance - numAmount });
      });

      await addDoc(collection(db, "withdraw_requests"), {
        userId: user.uid,
        displayName: user.displayName || "User",
        paymentMethod: selectedMethod.label,
        accountDetails: account,
        amount: numAmount,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      toast.success(`تم تقديم طلب سحب بقيمة ${numAmount} نقطة!`);
      setAmount("");
      setAccount("");
      setSelectedMethod(null);
    } catch (err: any) {
      toast.error(err.message || "فشلت عملية السحب");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4" dir="rtl">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">تم تقديم الطلب!</h2>
        <p className="text-muted-foreground font-medium">سيصلك المبلغ خلال 24-48 ساعة.</p>
        <button onClick={() => setSuccess(false)} className="mt-6 bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-bold">سحب جديد</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground">مركز السحب</h1>
        <p className="text-muted-foreground font-medium">حول مجهودك إلى مكافآت حقيقية</p>
      </div>

      {/* الرصيد */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-primary-foreground/80 text-sm font-bold">رصيدك المتوفر</p>
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-300" />
            <span className="text-3xl font-black">{balance.toLocaleString()}</span>
            <span className="text-xs font-bold opacity-80">نقطة</span>
          </div>
        </div>
        <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
          <p className="text-[10px] font-bold opacity-70">بالدولار</p>
          <p className="text-lg font-black">${(balance / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* قائمة طرق الدفع بالصور */}
      <div className="space-y-4">
        <label className="text-lg font-bold text-foreground mr-2 text-right block">اختر وسيلة الدفع</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => { setSelectedMethod(pm); setAmount(""); }}
              className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 ${
                selectedMethod?.id === pm.id
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-95"
                  : "border-border bg-card hover:border-primary/40 shadow-sm"
              }`}
            >
              <div className={`h-14 w-14 rounded-2xl p-2 flex items-center justify-center bg-white shadow-sm border border-gray-100`}>
                <img src={pm.image} alt={pm.label} className="h-full w-full object-contain" />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-black text-foreground truncate w-24">{pm.label}</p>
                <p className="text-[9px] text-primary font-bold">{pm.min}pt</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedMethod && (
        <div className="space-y-6 p-6 bg-secondary/20 rounded-3xl border-2 border-border animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={selectedMethod.image} className="h-10 w-10 object-contain" alt="" />
            <div>
              <h3 className="font-black text-foreground">{selectedMethod.label}</h3>
              <p className="text-xs text-muted-foreground font-bold italic">الحد الأدنى: {selectedMethod.min} نقطة</p>
            </div>
          </div>

          <div className="space-y-2 text-right">
            <label className="text-sm font-black text-foreground">بيانات الحساب</label>
            <input
              type="text"
              placeholder={selectedMethod.id === "paypal" ? "أدخل بريد PayPal" : "أدخل العنوان أو رقم المحفظة"}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-2 text-right">
            <label className="text-sm font-black text-foreground">المبلغ (بالنقاط)</label>
            <input
              type="number"
              placeholder={`الحد الأدنى ${selectedMethod.min}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-card border-2 border-border rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <button
            onClick={handleWithdraw}
            disabled={!canWithdraw || loading}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-black shadow-lg shadow-primary/30 hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "تأكيد السحب الآن"}
          </button>
        </div>
      )}
    </div>
  );
}
