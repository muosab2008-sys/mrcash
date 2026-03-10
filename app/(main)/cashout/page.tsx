"use client";

import { useState } from "react";
import {
  Wallet,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  Coins,
  Bitcoin,
  CreditCard,
  Gift,
  Gamepad2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { mockCashoutMethods } from "@/lib/mock-data";
import type { CashoutMethod } from "@/lib/types";

// Mock user balance
const userBalance = 0;

const categoryIcons = {
  crypto: Bitcoin,
  cashout: CreditCard,
  giftcard: Gift,
  skins: Gamepad2,
};

const categoryTitles = {
  crypto: "Crypto",
  cashout: "Cashout Methods",
  giftcard: "Gift Cards",
  skins: "Skins",
};

export default function CashoutPage() {
  const [selectedMethod, setSelectedMethod] = useState<CashoutMethod | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState("");

  const groupedMethods = mockCashoutMethods.reduce((acc, method) => {
    if (!acc[method.type]) {
      acc[method.type] = [];
    }
    acc[method.type].push(method);
    return acc;
  }, {} as Record<string, CashoutMethod[]>);

  const handleWithdraw = () => {
    if (!selectedMethod) return;
    console.log("Withdrawing to:", withdrawAddress, "Method:", selectedMethod.name);
    setSelectedMethod(null);
    setWithdrawAddress("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Choose Payment Method
              </h1>
              <p className="text-sm text-muted-foreground">
                Redeem your earnings to faucetpay, Binance, PayPal, and more —
                all within minutes!
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              Instant Processing
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Secure Payments
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              24/7 Available
            </Badge>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="border-border bg-card p-4 lg:min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Available Balance
            </span>
            <Badge className="bg-primary/10 text-primary">
              <CheckCircle className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Coins className="h-8 w-8 text-yellow-500" />
            <span className="text-3xl font-bold text-foreground">
              {userBalance}
            </span>
            <span className="text-lg text-muted-foreground">POINTS</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ready to withdraw
          </p>
        </Card>
      </div>

      {/* Payment Methods by Category */}
      {Object.entries(groupedMethods).map(([type, methods]) => {
        const Icon = categoryIcons[type as keyof typeof categoryIcons];
        const title = categoryTitles[type as keyof typeof categoryTitles];

        return (
          <section key={type}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-bold text-foreground">{title}</h2>
                <span className="text-sm text-muted-foreground">
                  {methods.length} options available
                </span>
              </div>
              <Badge className="bg-primary/10 text-primary">
                {methods.length}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {methods.map((method) => (
                <Card
                  key={method.id}
                  className="group cursor-pointer border-border bg-card p-4 transition-all hover:border-primary/50"
                  style={{
                    borderBottomWidth: 3,
                    borderBottomColor: method.borderColor || "transparent",
                  }}
                  onClick={() => setSelectedMethod(method)}
                >
                  {/* Logo placeholder */}
                  <div className="mb-3 flex h-16 items-center justify-center rounded-lg bg-muted/50">
                    <span className="text-xl font-bold text-foreground">
                      {method.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-center text-sm font-medium text-foreground">
                    {method.name}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {/* Withdrawal Modal */}
      <Dialog open={!!selectedMethod} onOpenChange={() => setSelectedMethod(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Withdraw to {selectedMethod?.name}</DialogTitle>
            <DialogDescription>
              Enter your {selectedMethod?.name} address or account to receive your
              funds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Balance Info */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">
                Available Balance
              </span>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="font-bold">{userBalance} POINTS</span>
              </div>
            </div>

            {/* Min Points */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">
                Minimum Withdrawal
              </span>
              <span className="font-medium">
                {selectedMethod?.minPoints} POINTS
              </span>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel>
                  {selectedMethod?.type === "crypto"
                    ? "Wallet Address"
                    : "Account / Email"}
                </FieldLabel>
                <Input
                  placeholder={
                    selectedMethod?.type === "crypto"
                      ? "Enter wallet address"
                      : "Enter email or account ID"
                  }
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="bg-input"
                />
              </Field>
            </FieldGroup>

            <Button
              className="w-full"
              disabled={
                !withdrawAddress ||
                userBalance < (selectedMethod?.minPoints || 0)
              }
              onClick={handleWithdraw}
            >
              {userBalance < (selectedMethod?.minPoints || 0)
                ? "Insufficient Balance"
                : "Request Withdrawal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
