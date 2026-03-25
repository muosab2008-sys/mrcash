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
import { Progress } from "@/components/ui/progress";
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

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          isOpen ? "translate-x-0 w-64 sm:w-72" : "-translate-x-full",
          isCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between border-b border-border p-3 sm:p-4 lg:hidden gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src="/logo.png"
              alt="MrCash"
              width={32}
              height={32}
              className="rounded-lg shrink-0"
            />
            <span className="font-bold brand-gradient-text truncate">MrCash</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop logo */}
        <div className={cn(
          "hidden items-center gap-2 border-b border-border p-3 sm:p-4 lg:flex transition-all",
          isCollapsed && "justify-center"
        )}>
          <Image
            src="/logo.png"
            alt="MrCash"
            width={isCollapsed ? 32 : 40}
            height={isCollapsed ? 32 : 40}
            className="rounded-lg shrink-0"
          />
          {!isCollapsed && (
            <span className="text-lg sm:text-xl font-bold brand-gradient-text truncate">MrCash</span>
          )}
        </div>

        {/* User stats (mobile) */}
        {userData && (
          <div className="border-b border-border p-3 sm:p-4 lg:hidden">
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground">Points</span>
              <span className="font-bold text-[var(--brand-cyan)] truncate">
                {userData.points > 999999 ? `${(userData.points / 1000000).toFixed(1)}M` : userData.points.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground">Fragments</span>
              <span className="font-bold text-[var(--brand-purple)] truncate">
                {userData.fragments > 999999 ? `${(userData.fragments / 1000000).toFixed(1)}M` : userData.fragments.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 no-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "brand-gradient text-primary-foreground shadow-lg shadow-purple-500/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isCollapsed && "lg:justify-center lg:px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="lg:block truncate">{item.label}</span>}
                  <span className="lg:hidden truncate">{item.label}</span>
                </Link>
              );

              return (
                <li key={item.href}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild className="hidden lg:block">
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="hidden lg:block">
                        {item.label}
                      </TooltipContent>
                      <div className="lg:hidden">{linkContent}</div>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
            
            {userData?.isAdmin && (
              <li>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild className="hidden lg:block">
                      <Link
                        href="/admin"
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors",
                          pathname.startsWith("/admin")
                            ? "brand-gradient text-primary-foreground shadow-lg shadow-purple-500/20"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          isCollapsed && "lg:justify-center lg:px-2"
                        )}
                      >
                        <Shield className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="lg:block">Admin</span>}
                        <span className="lg:hidden">Admin</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden lg:block">Admin</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors",
                      pathname.startsWith("/admin")
                        ? "brand-gradient text-primary-foreground shadow-lg shadow-purple-500/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Shield className="h-5 w-5 shrink-0" />
                    Admin
                  </Link>
                )}
              </li>
            )}
          </ul>
        </nav>

        {/* --- الأزرار القانونية الجديدة (قبل الليفل) --- */}
        <div className={cn(
          "px-3 sm:px-4 py-2 border-t border-border/50",
          isCollapsed && "lg:px-0 lg:flex lg:flex-col lg:items-center"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link 
                href="/privacy-policy" 
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] font-medium text-slate-500 hover:text-white hover:bg-white/5 transition-all",
                  isCollapsed && "lg:justify-center"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                {!isCollapsed && <span className="truncate">Privacy Policy</span>}
              </Link>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Privacy Policy</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link 
                href="/terms-of-service" 
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] font-medium text-slate-500 hover:text-white hover:bg-white/5 transition-all",
                  isCollapsed && "lg:justify-center"
                )}
              >
                <Globe className="h-4 w-4" />
                {!isCollapsed && <span className="truncate">Terms of Service</span>}
              </Link>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Terms of Service</TooltipContent>}
          </Tooltip>
        </div>

        {/* --- شريط الليفل المصلح في أسفل السايدبار --- */}
        <div className={cn(
          "mt-auto border-t border-border p-3 sm:p-4 bg-black/10",
          isCollapsed && "lg:p-2 lg:items-center lg:flex lg:flex-col"
        )}>
          {userData && !isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="text-white font-bold">Level {currentLevel}</span>
                <span className="text-muted-foreground font-mono">
                  {pointsInCurrentLevel.toLocaleString()} / {pointsPerLevel.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D2FF] to-[#A65FFF] transition-all duration-700 shadow-[0_0_8px_rgba(166,95,255,0.4)]" 
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          ) : (
            userData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 mx-auto group hover:border-purple-500/50 transition-colors cursor-help">
                    <span className="text-[10px] font-black text-purple-400">L{currentLevel}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Level {currentLevel} ({Math.floor(levelProgress)}% Progress)
                </TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
