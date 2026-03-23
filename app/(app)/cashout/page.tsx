"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Wallet,
} from "lucide-react";

interface Withdrawal {
  id: string;
  amount: number;
  pointsDeducted: number;
  method: string;
  paymentDetails: string;
  status: "pending" | "completed" | "rejected";
  createdAt: Date;
  processedAt?: Date;
}

const paymentMethods = [
  { id: "paypal", name: "PayPal", icon: Wallet, minAmount: 5 },
  { id: "crypto", name: "Cryptocurrency", icon: CreditCard, minAmount: 10 },
];

export default function CashoutPage() {
  const { userData } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");

  // Points to USD conversion (1000 points = $1)
  const pointsPerDollar = 1000;
  const availableBalance = (userData?.points || 0) / pointsPerDollar;

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, "withdrawals"),
      where("userId", "==", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            amount: d.amount,
            pointsDeducted: d.pointsDeducted,
            method: d.method,
            paymentDetails: d.paymentDetails,
            status: d.status,
            createdAt: (d.createdAt && typeof d.createdAt.toDate === 'function') ? d.createdAt.toDate() : new Date(),
            processedAt: (d.processedAt && typeof d.processedAt.toDate === 'function') ? d.processedAt.toDate() : null,
          };
        }) as Withdrawal[];
        setWithdrawals(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userData?.uid]);

  const handleWithdraw = async () => {
    if (!userData || !selectedMethod || !amount || !paymentDetails) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    const method = paymentMethods.find((m) => m.id === selectedMethod);

    if (!method) return;

    if (amountNum < method.minAmount) {
      toast.error(`Minimum withdrawal for ${method.name} is $${method.minAmount}`);
      return;
    }

    const pointsNeeded = amountNum * pointsPerDollar;
    if (pointsNeeded > (userData.points || 0)) {
      toast.error("Insufficient points");
      return;
    }

    setSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userData.uid);
        
        // Deduct points
        transaction.update(userRef, {
          points: (userData.points || 0) - pointsNeeded,
        });

        // Create withdrawal request
        const withdrawalRef = doc(collection(db, "withdrawals"));
        transaction.set(withdrawalRef, {
          userId: userData.uid,
          username: userData.username,
          email: userData.email,
          amount: amountNum,
          pointsDeducted: pointsNeeded,
          method: method.name,
          paymentDetails: paymentDetails,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });

      toast.success("Withdrawal request submitted!");
      setAmount("");
      setPaymentDetails("");
      setSelectedMethod(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-0">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive border-0">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-0">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Cashout</h1>
        <p className="text-muted-foreground">
          Withdraw your earnings to PayPal or Cryptocurrency
        </p>
      </div>

      {/* Balance */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl brand-gradient">
              <Coins className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points Balance</p>
              <p className="text-2xl font-bold text-[var(--brand-cyan)]">
                {userData?.points?.toLocaleString() ?? "0"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available to Withdraw</p>
              <p className="text-2xl font-bold text-emerald-500">
                ${availableBalance.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Form */}
      <Card className="border-[var(--brand-cyan)]/30 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[var(--brand-cyan)]" />
            New Withdrawal
          </CardTitle>
          <CardDescription>
            1,000 points = $1.00 USD
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Methods */}
          <div>
            <p className="mb-2 text-sm font-medium">Select Payment Method</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                      isSelected
                        ? "border-[var(--brand-cyan)] bg-[var(--brand-cyan)]/10"
                        : "border-border hover:border-[var(--brand-cyan)]/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? "text-[var(--brand-cyan)]" : "text-muted-foreground"
                      }`}
                    />
                    <div className="text-left">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Min: ${method.minAmount}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="mb-2 text-sm font-medium">Amount (USD)</p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
                min={selectedMethod ? paymentMethods.find((m) => m.id === selectedMethod)?.minAmount : 5}
                max={availableBalance}
                step={0.01}
              />
            </div>
            {amount && (
              <p className="mt-1 text-xs text-muted-foreground">
                = {(parseFloat(amount || "0") * pointsPerDollar).toLocaleString()} points
              </p>
            )}
          </div>

          {/* Payment Details */}
          <div>
            <p className="mb-2 text-sm font-medium">
              {selectedMethod === "paypal" ? "PayPal Email" : "Wallet Address"}
            </p>
            <Input
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder={
                selectedMethod === "paypal"
                  ? "your@email.com"
                  : "Enter your wallet address"
              }
            />
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={submitting || !selectedMethod || !amount || !paymentDetails}
            className="w-full brand-gradient text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Request Withdrawal"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4 animate-pulse"
                >
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-5 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No withdrawals yet</p>
              <p className="text-sm text-muted-foreground">
                Your withdrawal history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        ${withdrawal.amount.toFixed(2)}
                      </span>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.method} - {
  (withdrawal.createdAt instanceof Date) 
  ? withdrawal.createdAt.toLocaleDateString() 
  : "Pending..."
}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    -{withdrawal.pointsDeducted?.toLocaleString() ?? "0"} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
