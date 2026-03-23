"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wallet, UserPlus, Coins, Gift, User } from "lucide-react";

const navItems = [
  { href: "/cashout", label: "Cashout", icon: Wallet },
  { href: "/referrals", label: "Referrals", icon: UserPlus },
  { href: "/", label: "Earn", icon: Coins, isMain: true },
  { href: "/offers", label: "Offers", icon: Gift },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Main container with rounded top corners */}
      <div className="relative bg-[#1a1a1a] pt-8 pb-2 rounded-t-[28px] shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        {/* Notch cutout for center button */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-8 bg-background rounded-b-[24px]" />
        
        {/* Navigation items */}
        <div className="flex items-end justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isMain) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative -mt-14 flex flex-col items-center"
                >
                  {/* Outer glow ring */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#00D67E]/20 blur-xl" />
                  
                  {/* Main button with border */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#00D67E]/30 blur-md" />
                    <div
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-full",
                        "bg-[#00D67E] shadow-[0_0_20px_rgba(0,214,126,0.5)]",
                        "border-4 border-[#1a1a1a]",
                        "transition-transform hover:scale-105 active:scale-95"
                      )}
                    >
                      <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <span className={cn(
                    "mt-2 text-xs font-semibold",
                    "text-[#00D67E]"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-200",
                  isActive 
                    ? "text-white" 
                    : "text-[#6b6b6b] hover:text-[#999]"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        
        {/* Home indicator bar */}
        <div className="flex justify-center mt-3 pb-1">
          <div className="w-32 h-1 bg-[#3a3a3a] rounded-full" />
        </div>
      </div>
    </nav>
  );
}
