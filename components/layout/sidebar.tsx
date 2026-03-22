"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  Coins,
  Gift,
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "Earn", icon: Coins },
  { href: "/giveaways", label: "Free Giveaways", icon: Gift },
  { href: "/levels", label: "Levels", icon: Trophy },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/promo", label: "Promo Codes", icon: Ticket },
  { href: "/cashout", label: "Cashout", icon: DollarSign },
  { href: "/offers", label: "Offers", icon: LayoutGrid },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userData } = useAuth();

  // Calculate level progress
  const currentLevelThreshold = (userData?.level || 1) * 10000;
  const previousLevelThreshold = ((userData?.level || 1) - 1) * 10000;
  const pointsInCurrentLevel = (userData?.totalEarned || 0) - previousLevelThreshold;
  const pointsNeededForLevel = currentLevelThreshold - previousLevelThreshold;
  const levelProgress = Math.min((pointsInCurrentLevel / pointsNeededForLevel) * 100, 100);

  return (
    <>
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
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
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
        <div className="hidden items-center gap-2 border-b border-border p-4 lg:flex">
          <Image
            src="/logo.png"
            alt="MrCash"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-xl font-bold brand-gradient-text">MrCash</span>
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
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "brand-gradient text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {userData?.isAdmin && (
              <li>
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
              </li>
            )}
          </ul>
        </nav>

        {/* Level progress */}
        {userData && (
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
      </aside>
    </>
  );
}
