"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Settings, Menu, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "@/components/notifications/notification-panel";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, userData, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-secondary"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="MrCash"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="hidden font-bold text-lg sm:inline-block bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-purple)] bg-clip-text text-transparent">
              MrCash
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user && userData ? (
            <>
              {/* Points display - desktop */}
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-2 border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-cyan)] animate-pulse" />
                  <span className="text-xs text-muted-foreground">Points</span>
                  <span className="font-bold text-sm text-foreground">
                    {userData.points.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-2 border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-purple)]" />
                  <span className="text-xs text-muted-foreground">Fragments</span>
                  <span className="font-bold text-sm text-foreground">
                    {userData.fragments.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Mobile points */}
              <div className="flex sm:hidden items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1.5 border border-border/50">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)]" />
                <span className="font-bold text-xs text-foreground">
                  {userData.points.toLocaleString()}
                </span>
              </div>

              <NotificationPanel />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-secondary">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{userData.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {userData.level} • ID: {userData.uid.slice(0, 8)}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  {userData.isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="text-red-500 focus:text-red-500 cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button className="gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-purple)] hover:opacity-90 transition-opacity">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
