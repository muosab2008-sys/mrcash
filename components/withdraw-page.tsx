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
} from "lucide-react";
import { toast } from "sonner";

const paymentMethods = [
  { id: "paypal", label: "PayPal", icon: "P" },
  { id: "usdt", label: "USDT (TRC20)", icon: "U" },
  { id: "bank", label: "Bank Transfer", icon: "B" },
  { id: "payeer", label: "Payeer", icon: "P" },
];

const MIN_WITHDRAW = 500;

export function WithdrawPage() {
  const { user, balance } = useAuth();
  const [method, setMethod] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const numAmount = parseInt(amount) || 0;
  const canWithdraw = numAmount >= MIN_WITHDRAW && numAmount <= balance && method && account;

  const handleWithdraw = async () => {
    if (!canWithdraw) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found");

        const currentBalance = userDoc.data().balance || 0;
        if (currentBalance < numAmount) throw new Error("Insufficient balance");

        transaction.update(userRef, {
          balance: currentBalance - numAmount,
        });
      });

      await addDoc(collection(db, "withdraw_requests"), {
        userId: user.uid,
        displayName: user.displayName || "User",
        email: user.email || "",
        paymentMethod: method,
        accountDetails: account,
        amount: numAmount,
        cashValue: (numAmount / 100).toFixed(2),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      toast.success(`Withdrawal of ${numAmount} points submitted!`);
      setAmount("");
      setAccount("");
      setMethod("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Request Submitted</h2>
        <p className="text-sm text-muted-foreground">
          Your withdrawal request has been submitted and will be processed within 24-48 hours.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          New Withdrawal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Withdraw Funds</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Request a withdrawal of your earned points
        </p>
      </div>

      {/* Balance card */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available Balance</p>
            <p className="text-xl font-bold text-foreground">
              {balance.toLocaleString()} pts
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Cash Value</p>
          <p className="text-lg font-bold text-primary">
            {"$"}{(balance / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {balance < MIN_WITHDRAW && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Insufficient balance</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {"You need at least "}{MIN_WITHDRAW}{" points to make a withdrawal. Keep completing offers!"}
            </p>
          </div>
        </div>
      )}

      {/* Payment method */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => setMethod(pm.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                method === pm.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  method === pm.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {pm.icon}
              </div>
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account details */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="account">
          Account Details
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="account"
            type="text"
            placeholder="Email, wallet address, or IBAN"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="amount">
          Amount (points)
        </label>
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="amount"
            type="number"
            placeholder={`Min. ${MIN_WITHDRAW} points`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={MIN_WITHDRAW}
            max={balance}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {numAmount > 0 && (
          <p className="text-xs text-muted-foreground">
            {"Cash value: "}
            <span className="text-primary font-medium">
              {"$"}{(numAmount / 100).toFixed(2)}
            </span>
          </p>
        )}
      </div>

      <button
        onClick={handleWithdraw}
        disabled={!canWithdraw || loading}
        className="w-full bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Submit Withdrawal
          </>
        )}
      </button>
    </div>
  );
}
