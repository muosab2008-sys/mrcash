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

// تعريف طرق الدفع مع الشروط الخاصة بك
const paymentMethods = [
  { id: "paypal", label: "PayPal", min: 5000, max: 50000, icon: "P", color: "bg-blue-600", type: "wallet" },
  { id: "binance", label: "Binance (USDT)", min: 100, max: 10000, icon: "B", color: "bg-yellow-500", type: "wallet" },
  { id: "faucetpay", label: "FaucetPay", min: 50, max: 5000, icon: "F", color: "bg-indigo-500", type: "wallet" },
  { id: "cwallet", label: "C-Wallet", min: 50, max: 5000, icon: "C", color: "bg-cyan-500", type: "wallet" },
  // بطاقات الهدايا - حد أدنى 1000 نقطة
  { id: "google_play", label: "Google Play", min: 1000, max: 10000, icon: "G", color: "bg-green-600", type: "gift" },
  { id: "itunes", label: "iTunes Card", min: 1000, max: 10000, icon: "A", color: "bg-gray-800", type: "gift" },
  { id: "amazon", label: "Amazon Gift", min: 1000, max: 10000, icon: "Z", color: "bg-orange-400", type: "gift" },
  { id: "freefire", label: "Free Fire Gems", min: 1000, max: 10000, icon: "FF", color: "bg-red-500", type: "gift" },
  { id: "pubg", label: "PUBG UC", min: 1000, max: 10000, icon: "UC", color: "bg-orange-600", type: "gift" },
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
  
  // التحقق من الشروط الديناميكية بناءً على الشركة المختارة
  const canWithdraw = 
    selectedMethod && 
    numAmount >= selectedMethod.min && 
    numAmount <= balance && 
    account.length > 3;

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

        transaction.update(userRef, {
          balance: currentBalance - numAmount,
        });
      });

      await addDoc(collection(db, "withdraw_requests"), {
        userId: user.uid,
        displayName: user.displayName || "User",
        email: user.email || "",
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
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">تم تقديم الطلب بنجاح!</h2>
        <p className="text-muted-foreground">
          سيتم مراجعة طلبك وإرسال الدفعة خلال 24 إلى 48 ساعة.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-bold hover:opacity-90 transition-all"
        >
          العودة للسحب
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground">سحب الأرباح</h1>
        <p className="text-muted-foreground font-medium">حول نقاطك إلى أموال حقيقية أو هدايا</p>
      </div>

      {/* بطاقة الرصيد بتصميم جديد */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-primary-foreground/80 text-sm font-bold">رصيدك الحالي</p>
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            <span className="text-3xl font-black tracking-tight">{balance.toLocaleString()}</span>
            <span className="text-sm opacity-80 font-bold">نقطة</span>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-center">
          <p className="text-[10px] uppercase font-bold opacity-80">القيمة المالية</p>
          <p className="text-xl font-black">${(balance / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* اختيار طريقة السحب */}
      <div className="space-y-4">
        <label className="text-lg font-bold text-foreground mr-2">اختر وسيلة الدفع</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => {
                setSelectedMethod(pm);
                setAmount("");
              }}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedMethod?.id === pm.id
                  ? "border-primary bg-primary/5 shadow-inner scale-95"
                  : "border-border bg-card hover:border-primary/40 shadow-sm"
              }`}
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-black shadow-lg ${pm.color}`}>
                {pm.icon}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{pm.label}</p>
                <p className="text-[10px] text-muted-foreground font-bold italic">الحد الأدنى: {pm.min}pt</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedMethod && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* تفاصيل الحساب */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground mr-1">
              {selectedMethod.type === "wallet" ? "عنوان المحفظة أو البريد الإلكتروني" : "بيانات استلام الهدية"}
            </label>
            <div className="relative">
              <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={selectedMethod.id === "paypal" ? "بريد PayPal الإلكتروني" : "أدخل العنوان هنا..."}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-card border-2 border-border rounded-2xl pr-12 pl-4 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* مبلغ السحب */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground mr-1">الكمية المراد سحبها (بالنقاط)</label>
            <div className="relative">
              <ArrowRightLeft className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="number"
                placeholder={`أقل كمية هي ${selectedMethod.min} نقطة`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-card border-2 border-border rounded-2xl pr-12 pl-4 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
              />
            </div>
            {numAmount > 0 && (
              <p className="text-xs text-primary font-bold mr-1">
                ستحصل على ما يعادل: ${(numAmount / 100).toFixed(2)}
              </p>
            )}
          </div>

          {/* زر السحب */}
          <button
            onClick={handleWithdraw}
            disabled={!canWithdraw || loading}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-black shadow-lg shadow-primary/30 hover:opacity-90 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>تأكيد عملية السحب <Wallet className="h-5 w-5" /></>}
          </button>
        </div>
      )}
      
      {!selectedMethod && (
        <div className="bg-secondary/30 border-2 border-dashed border-border rounded-3xl p-12 text-center">
          <Gift className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-bold">يرجى اختيار وسيلة سحب لعرض التفاصيل</p>
        </div>
      )}
    </div>
  );
}
