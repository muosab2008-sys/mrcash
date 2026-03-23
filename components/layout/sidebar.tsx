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

  // Calculate level progress
  const currentLevelThreshold = (userData?.level || 1) * 10000;
  const previousLevelThreshold = ((userData?.level || 1) - 1) * 10000;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

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
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300 lg:sticky lg:top-0 lg:z-0 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-16" : "w-64"
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between border-b border-border p-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="MrCash"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold brand-gradient-text">MrCash</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop logo */}
        <div className={cn(
          "hidden items-center gap-2 border-b border-border p-4 lg:flex",
          isCollapsed && "justify-center"
        )}>
          <Image
            src="/logo.png"
            alt="MrCash"
            width={isCollapsed ? 32 : 40}
            height={isCollapsed ? 32 : 40}
            className="rounded-lg"
          />
          {!isCollapsed && (
            <span className="text-xl font-bold brand-gradient-text">MrCash</span>
          )}
        </div>

        {/* User stats (mobile) */}
        {userData && (
          <div className="border-b border-border p-4 lg:hidden">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Points</span>
              <span className="font-bold text-[var(--brand-cyan)]">
                {userData.points.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fragments</span>
              <span className="font-bold text-[var(--brand-purple)]">
                {userData.fragments.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 no-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "brand-gradient text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isCollapsed && "lg:justify-center lg:px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="lg:block">{item.label}</span>}
                  <span className="lg:hidden">{item.label}</span>
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
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          pathname.startsWith("/admin")
                            ? "brand-gradient text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          isCollapsed && "lg:justify-center lg:px-2"
                        )}
                      >
                        <Shield className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span className="lg:block">Admin</span>}
                        <span className="lg:hidden">Admin</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden lg:block">
                      Admin
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname.startsWith("/admin")
                        ? "brand-gradient text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Shield className="h-5 w-5" />
                    Admin
                  </Link>
                )}
              </li>
            )}
          </ul>
        </nav>

        {/* Level progress */}
        {userData && !isCollapsed && (
          <div className="border-t border-border p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Level {userData.level}</span>
              <span className="text-muted-foreground">
                {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevel.toLocaleString()}
              </span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
        )}
        
        {/* Collapsed level indicator */}
        {userData && isCollapsed && (
          <div className="hidden border-t border-border p-2 lg:block">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mx-auto">
                  <span className="text-xs font-bold text-[var(--brand-cyan)]">
                    L{userData.level}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                Level {userData.level} - {pointsInCurrentLevel.toLocaleString()} / {pointsNeededForLevel.toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
