"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  Coins,
  Trophy,
  Users,
  Ticket,
  User,
  DollarSign,
  LayoutGrid,
  Shield,
  X,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

const navItems = [
  { href: "/", label: "Earn", icon: Coins },
  { href: "/levels", label: "Levels", icon: Trophy },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/promo", label: "Promo Codes", icon: Ticket },
  { href: "/cashout", label: "Cashout", icon: DollarSign },
  { href: "/offers", label: "Offers", icon: LayoutGrid },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar({ isOpen, onClose, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { userData } = useAuth();

  // --- الحسبة الدقيقة لشريط الليفل ---
  const pointsPerLevel = 10000;
  const totalEarned = userData?.totalEarned || 0;
  const currentLevel = Math.floor(totalEarned / pointsPerLevel) + 1;
  const pointsInCurrentLevel = totalEarned % pointsPerLevel;
  const levelProgress = (pointsInCurrentLevel / pointsPerLevel) * 100;

  // دالة لتنسيق الأرقام الكبيرة (مثل 1M)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    return num.toLocaleString();
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0 w-64 sm:w-72" : "-translate-x-full",
          isCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-border p-3 sm:p-4 lg:hidden gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/logo.png" alt="MrCash" width={32} height={32} className="rounded-lg shrink-0" />
            <span className="font-bold brand-gradient-text truncate">MrCash</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className={cn(
          "hidden items-center gap-2 border-b border-border p-3 sm:p-4 lg:flex",
          isCollapsed && "justify-center"
        )}>
          <Image src="/logo.png" alt="MrCash" width={isCollapsed ? 32 : 40} height={isCollapsed ? 32 : 40} className="rounded-lg shrink-0" />
          {!isCollapsed && <span className="text-lg font-bold brand-gradient-text truncate">MrCash</span>}
        </div>

        {/* User Stats (Mobile only) */}
        {userData && (
          <div className="border-b border-border p-3 sm:p-4 lg:hidden space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Points</span>
              <span className="font-bold text-[var(--brand-cyan)]">{formatNumber(userData.points || 0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fragments</span>
              <span className="font-bold text-[var(--brand-purple)]">{formatNumber(userData.fragments || 0)}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 no-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive ? "brand-gradient text-primary-foreground shadow-lg shadow-purple-500/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          isCollapsed && "lg:justify-center"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className={cn("truncate", isCollapsed && "lg:hidden")}>{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right" className="hidden lg:block">{item.label}</TooltipContent>}
                  </Tooltip>
                </li>
              );
            })}

            {/* Admin Section */}
            {userData?.isAdmin && (
              <li className="mt-4 pt-4 border-t border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        pathname.startsWith("/admin") ? "brand-gradient text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                        isCollapsed && "lg:justify-center"
                      )}
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      <span className={cn("truncate", isCollapsed && "lg:hidden")}>Admin Panel</span>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right" className="hidden lg:block">Admin Panel</TooltipContent>}
                </Tooltip>
              </li>
            )}
          </ul>
        </nav>

        {/* Legal Links */}
        <div className={cn("px-4 py-2 border-t border-border/50", isCollapsed && "lg:hidden")}>
          <Link href="/privacy-policy" className="flex items-center gap-2 py-1.5 text-[10px] text-slate-500 hover:text-white transition-colors">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </Link>
          <Link href="/terms-of-service" className="flex items-center gap-2 py-1.5 text-[10px] text-slate-500 hover:text-white transition-colors">
            <Globe className="h-3.5 w-3.5" />
            <span>Terms of Service</span>
          </Link>
        </div>

        {/* Level Progress Footer */}
        <div className={cn(
          "mt-auto border-t border-border p-4 bg-black/20",
          isCollapsed && "lg:p-2 lg:flex lg:justify-center"
        )}>
          {userData && !isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white font-bold">Level {currentLevel}</span>
                <span className="text-muted-foreground font-mono">{Math.floor(levelProgress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D2FF] to-[#A65FFF] transition-all duration-700" 
                  style={{ width: `${levelProgress}%` }} 
                />
              </div>
              <div className="text-[9px] text-center text-muted-foreground uppercase tracking-widest">
                {pointsInCurrentLevel.toLocaleString()} / {pointsPerLevel.toLocaleString()} XP
              </div>
            </div>
          ) : (
            userData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 mx-auto cursor-help">
                    <span className="text-[10px] font-black text-purple-400">L{currentLevel}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Level {currentLevel} - {Math.floor(levelProgress)}%</TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
