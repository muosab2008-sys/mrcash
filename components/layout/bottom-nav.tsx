"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wallet, UserPlus, Home, Gift, User } from "lucide-react";

const navItems = [
  { href: "/cashout", label: "Cashout", icon: Wallet },
  { href: "/referrals", label: "Referrals", icon: UserPlus },
  { href: "/", label: "Home", icon: Home, isMain: true },
  { href: "/offers", label: "Offers", icon: Gift },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pb-4 pointer-events-none">
      {/* Sleek rectangular container */}
      <div className="relative bg-[#0a0a0a] py-2 rounded-2xl border border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] pointer-events-auto backdrop-blur-xl">
        
        {/* Navigation items */}
        <div className="flex items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isMain) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative -mt-8 flex flex-col items-center"
                >
                  {/* Glow effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-gradient-to-r from-[#3B82F6]/40 to-[#8B5CF6]/40 blur-xl" />
                  
                  {/* Main button - rectangular style */}
                  <div className="relative">
                    <div
                      className={cn(
                        "relative flex h-14 w-14 items-center justify-center rounded-2xl",
                        "bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6]",
                        "shadow-[0_4px_20px_rgba(59,130,246,0.4)]",
                        "border-4 border-[#0a0a0a]",
                        "transition-all duration-300 hover:scale-105 active:scale-95"
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  {/* Button label */}
                  <span className="mt-1.5 text-[10px] font-bold text-white tracking-wide uppercase">
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
                  "flex flex-col items-center gap-1 px-3 py-2 transition-all duration-200 rounded-xl",
                  isActive 
                    ? "text-white" 
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isActive && "bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20"
                )}>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
