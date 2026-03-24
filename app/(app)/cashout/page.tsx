"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Coins,
  Zap,
  Lock,
  Clock,
  Gift,
  Smartphone,
  CreditCard,
  ExternalLink,
} from "lucide-react";

interface CashoutOption {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  borderColor: string;
  count?: number;
}

const cryptoOptions: CashoutOption[] = [
  { id: "faucet", name: "FaucetPay", borderColor: "from-blue-500" },
  { id: "binance", name: "Binance", borderColor: "from-yellow-500" },
  { id: "litecoin", name: "Litecoin", borderColor: "from-cyan-400" },
  { id: "cwallet", name: "cWallet", borderColor: "from-green-500" },
];

const cashoutMethods: CashoutOption[] = [
  { id: "paypal", name: "PayPal", borderColor: "from-blue-500" },
  { id: "visa", name: "Visa Tremendous", borderColor: "from-cyan-400" },
  { id: "egypt", name: "Egypt Cash", borderColor: "from-red-500" },
  { id: "syriatel", name: "Syriatel / MTN", borderColor: "from-yellow-500" },
  { id: "syriatel-cash", name: "Syriatel / MTN Cash", borderColor: "from-yellow-500" },
  { id: "sham", name: "Sham Cash", borderColor: "from-green-500" },
];

const giftCards: CashoutOption[] = [
  { id: "amazon", name: "Amazon", borderColor: "from-yellow-400" },
  { id: "googleplay", name: "Google Play us", borderColor: "from-green-500" },
  { id: "itunes", name: "iTunes Apple", borderColor: "from-blue-400" },
  { id: "razer", name: "Razer Gold", borderColor: "from-amber-400" },
];

export default function CashoutPage() {
  const { userData } = useAuth();

  const availableBalance = (userData?.points || 0) / 1000;

  const handleCardClick = (optionName: string) => {
    // This will be implemented with actual payment processing
    console.log(`Selected: ${optionName}`);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main Hero Content */}
          <div className="lg:col-span-2">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex h-12 sm:h-16 w-12 sm:w-16 items-center justify-center rounded-full sm:rounded-2xl bg-[#A65FFF] shrink-0">
                <DollarSign className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2">
                  Choose Payment Method
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-white/70">
                  Redeem your earnings to faucetpay, Binance, PayPal, and more — all within minutes!
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-4 sm:mt-6 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Zap className="h-4 sm:h-5 w-4 sm:w-5 text-[#A65FFF] shrink-0" />
                <span className="text-xs sm:text-sm text-white/80">Instant Processing</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Lock className="h-4 sm:h-5 w-4 sm:w-5 text-[#A65FFF] shrink-0" />
                <span className="text-xs sm:text-sm text-white/80">Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-[#A65FFF] shrink-0" />
                <span className="text-xs sm:text-sm text-white/80">24/7 Available</span>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="lg:col-span-1">
            <Card className="border-[#A65FFF]/40 bg-[#A65FFF]/10 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs sm:text-sm font-medium text-green-500">Available Balance</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs sm:text-sm">
                    <Coins className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {availableBalance.toFixed(2)}
                  </span>
                  <span className="text-xs sm:text-sm text-white/70 ml-1">POINTS</span>
                </div>
                <p className="text-xs text-white/60 mt-3 sm:mt-4">Ready to withdraw</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Crypto Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-full bg-orange-500/20">
              <Smartphone className="h-4 sm:h-5 w-4 sm:w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Crypto</h2>
              <p className="text-xs text-white/50">{cryptoOptions.length} options available</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs sm:text-sm h-fit">
            {cryptoOptions.length}
          </Badge>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {cryptoOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleCardClick(option.name)}
              className={`group relative h-32 sm:h-40 rounded-lg sm:rounded-xl border-2 border-gradient-to-br bg-black/40 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#A65FFF]/20 overflow-hidden cursor-pointer`}
              style={{
                borderImage: `linear-gradient(135deg, var(--crypto-color-${option.id}), transparent) 1`,
                borderImageSlice: 1,
              }}
            >
              {/* Gradient border using background */}
              <div
                className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${option.borderColor}`}
                style={{ opacity: 0.1 }}
              ></div>

              <div className="absolute inset-0.5 sm:inset-1 rounded-md sm:rounded-lg bg-black/80 flex items-center justify-center flex-col gap-2 sm:gap-3">
                <span className="text-base sm:text-lg font-black text-white text-center px-2">
                  {option.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cashout Methods Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-full bg-[#A65FFF]/20">
              <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 text-[#A65FFF]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Cashout Methods</h2>
              <p className="text-xs text-white/50">{cashoutMethods.length} options available</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs sm:text-sm h-fit">
            {cashoutMethods.length}
          </Badge>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cashoutMethods.map((option) => (
            <button
              key={option.id}
              onClick={() => handleCardClick(option.name)}
              className={`group relative h-32 sm:h-40 rounded-lg sm:rounded-xl border-2 border-gradient-to-br bg-black/40 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#A65FFF]/20 overflow-hidden cursor-pointer`}
            >
              {/* Gradient border using background */}
              <div
                className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${option.borderColor}`}
                style={{ opacity: 0.1 }}
              ></div>

              <div className="absolute inset-0.5 sm:inset-1 rounded-md sm:rounded-lg bg-black/80 flex items-center justify-center flex-col gap-2 sm:gap-3">
                <span className="text-base sm:text-lg font-black text-white text-center px-2">
                  {option.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Gift Cards Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-full bg-[#00D2FF]/20">
              <Gift className="h-4 sm:h-5 w-4 sm:w-5 text-[#00D2FF]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Gift Cards</h2>
              <p className="text-xs text-white/50">{giftCards.length} options available</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs sm:text-sm h-fit">
            {giftCards.length}
          </Badge>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {giftCards.map((option) => (
            <button
              key={option.id}
              onClick={() => handleCardClick(option.name)}
              className={`group relative h-32 sm:h-40 rounded-lg sm:rounded-xl border-2 border-gradient-to-br bg-black/40 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#A65FFF]/20 overflow-hidden cursor-pointer`}
            >
              {/* Gradient border using background */}
              <div
                className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${option.borderColor}`}
                style={{ opacity: 0.1 }}
              ></div>

              <div className="absolute inset-0.5 sm:inset-1 rounded-md sm:rounded-lg bg-black/80 flex items-center justify-center flex-col gap-2 sm:gap-3">
                <span className="text-base sm:text-lg font-black text-white text-center px-2">
                  {option.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
