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
  X,
  Coins,
  Gift,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";

// تعريف طرق الدفع مع الشعارات الحقيقية
const paymentMethods = [
  { id: "paypal", label: "PayPal", min: 5000, image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg", color: "bg-blue-50", type: "wallet" },
  { id: "binance", label: "Binance (USDT)", min: 100, image: "https://upload.wikimedia.org/wikipedia/commons/1/12/Binance_logo.svg", color: "bg-yellow-50", type: "wallet" },
  { id: "faucetpay", label: "FaucetPay", min: 50, image: "https://faucetpay.io/static/images/favicon.png", color: "bg-indigo-50", type: "wallet" },
  { id: "cwallet", label: "C-Wallet", min: 50, image: "https://c-wallet.com/images/logo-icon.png", color: "bg-cyan-50", type: "wallet" },
  { id: "google_play", label: "Google Play", min: 1000, image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_google_play_p_logo.png", color: "bg-green-50", type: "gift" },
  { id: "amazon", label: "Amazon Gift", min: 1000, image: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg", color: "bg-orange-50", type: "gift" },
  { id: "freefire", label: "Free Fire Gems", min: 1000, image: "https://upload.wikimedia.org/wikipedia/en/3/36/Garena_Free_Fire_logo.png", color: "bg-red-50", type: "gift" },
  { id: "pubg", label: "PUBG UC", min: 1000, image: "https://w7.pngwing.com/pngs/351/799/png-transparent-pubg-mobile-logo-thumbnail.png", color: "bg-orange-50", type: "gift" },
];

export function WithdrawPage() {
  const { user, balance } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground">متجر المكافآت</h1>
        <p className="text-muted-foreground font-medium italic">اختر وسيلة السحب المفضلة لديك</p>
      </div>

      {/* الرصيد العلوي */}
      <div className="bg-card border-2 border-border rounded-3xl p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Coins className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground">رصيدك الحالي</p>
            <p className="text-2xl font-black text-foreground">{balance.toLocaleString()} pt</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-muted-foreground">القيمة التقريبية</p>
          <p className="text-xl font-black text-primary">${(balance / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* شبكة خيارات السحب */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {paymentMethods.map((pm) => (
          <button
            key={pm.id}
            onClick={() => setSelectedMethod(pm)}
            className="group flex flex-col items-center gap-4 p-6 rounded-[2rem] bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="h-16 w-16 rounded-2xl p-2 bg-white shadow-sm group-hover:scale-110 transition-transform">
              <img src={pm.image} alt={pm.label} className="h-full w-full object-contain" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-foreground">{pm.label}</p>
              <div className="mt-1 px-3 py-1 bg-secondary rounded-full">
                <p className="text-[10px] text-primary font-bold">من {pm.min} نقطة</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* النافذة المنبثقة (Modal) - تظهر عند اختيار وسيلة سحب */}
      {selectedMethod && (
        <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-card border-2 border-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* رأس النافذة */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-3">
                <img src={selectedMethod.image} className="h-8 w-8 object-contain" alt="" />
                <h3 className="font-black text-lg text-foreground">سحب {selectedMethod.label}</h3>
              </div>
              <button 
                onClick={() => setSelectedMethod(null)}
                className="p-2 hover:bg-background rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            {/* محتوى النافذة */}
            <div className="p-8 space-y-6 text-right">
              <div className="space-y-2">
                <label className="text-sm font-black text-foreground mr-1">بيانات الحساب</label>
                <div className="relative">
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={selectedMethod.id === "paypal" ? "بريد PayPal" : "العنوان أو المعرف"}
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full bg-background border-2 border-border rounded-2xl pr-12 pl-4 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-foreground mr-1">الكمية (بالنقاط)</label>
                <div className="relative">
                  <ArrowRightLeft className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder={`الحد الأدنى ${selectedMethod.min}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-background border-2 border-border rounded-2xl pr-12 pl-4 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-muted-foreground font-bold italic">رصيدك: {balance} pt</p>
                  {numAmount > 0 && <p className="text-[10px] text-primary font-bold">ستستلم: ${(numAmount / 100).toFixed(2)}</p>}
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!canWithdraw || loading}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-5 font-black shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "تأكيد وإرسال الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
