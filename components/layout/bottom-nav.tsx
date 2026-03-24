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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4">
      {/* الحاوية الرئيسية بتصميم كبسولة سوداء مثل الصورة */}
      <div className="relative bg-[#0D0D0D] py-3 rounded-[35px] border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        
        {/* توزيع الأزرار */}
        <div className="flex items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isMain) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative -mt-12 flex flex-col items-center"
                >
                  {/* توهج خلفي قوي للزر الأخضر */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#00E676]/30 blur-2xl" />
                  
                  {/* الزر الدائري الأخضر البارز (مثل الصورة) */}
                  <div className="relative">
                    <div
                      className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-full",
                        "bg-[#00E676] shadow-[0_8px_20px_rgba(0,230,118,0.4)]",
                        "border-[6px] border-[#0D0D0D]",
                        "transition-all duration-300 hover:scale-110 active:scale-95"
                      )}
                    >
                      <Icon className="h-8 w-8 text-black" strokeWidth={3} />
                    </div>
                  </div>
                  {/* نص الزر بلون أخضر فاقع */}
                  <span className="mt-2 text-xs font-bold text-[#00E676] tracking-wide">
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
                  "flex flex-col items-center gap-1 px-2 py-1 transition-all duration-200",
                  isActive 
                    ? "text-white scale-110" 
                    : "text-[#505050] hover:text-[#808080]"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">
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
