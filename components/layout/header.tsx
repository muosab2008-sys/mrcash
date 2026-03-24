"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Settings, Menu } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#050505]/80 backdrop-blur-xl">
      <div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 md:px-6">
        
        {/* Left section: Menu button + Logo (Mobile only) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-white/5 text-white shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo: Mobile only */}
          <Link href="/" className="lg:hidden flex items-center gap-2 min-w-0">
            <Image 
              src="/logo.png" 
              alt="MrCash Logo"
              width={24} 
              height={24}
              priority
              className="object-contain w-6 h-6 sm:w-7 sm:h-7 shrink-0"
            />
            
            <span className="text-base sm:text-lg font-bold tracking-tighter hidden xs:inline min-w-0 truncate">
              <span className="bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] bg-clip-text text-transparent">
                MrCash
              </span>
            </span>
          </Link>
        </div>

        {/* Right section: Balance and Settings */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0">
          {user && userData ? (
            <>
              {/* Balance display - Capsule design */}
              <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/[0.03] px-2 sm:px-3 py-1 sm:py-1.5 border border-white/[0.08] shrink-0">
                <Image 
                  src="/coin.png" 
                  alt="Coin" 
                  width={16} 
                  height={16} 
                  priority 
                  className="object-contain animate-pulse w-4 h-4 sm:w-5 sm:h-5 shrink-0" 
                />

                <span className="font-bold text-xs sm:text-sm text-white whitespace-nowrap">
                  {(userData?.points || 0) > 999999 ? `${(userData?.points / 1000000).toFixed(1)}M` : (userData?.points || 0).toLocaleString()}
                </span>
                
                <span className="hidden sm:inline text-[10px] text-white/40 font-medium uppercase tracking-widest ml-0.5">
                  Pts
                </span>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1">
                <NotificationPanel />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5 text-white/50 h-9 w-9 sm:h-10 sm:w-10">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 sm:w-56 rounded-2xl bg-[#0A0A0A] border-white/10 text-white shadow-2xl">
                    <div className="px-3 sm:px-4 py-2 sm:py-3">
                      <p className="text-xs sm:text-sm font-bold text-white/90 truncate">{userData?.username}</p>
                      <p className="text-[10px] sm:text-[11px] text-white/40 truncate">
                        Level {userData?.level || 1} • ID: {userData?.uid?.slice(0, 6)}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem asChild className="cursor-pointer py-2 sm:py-2.5 text-xs sm:text-sm focus:bg-white/5 focus:text-[#A65FFF]">
                      <Link href="/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    {userData?.isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer py-2 sm:py-2.5 text-xs sm:text-sm focus:bg-white/5 focus:text-[#A65FFF]">
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem 
                      onClick={logout} 
                      className="text-red-500 py-2 sm:py-2.5 text-xs sm:text-sm focus:text-red-400 focus:bg-red-500/5 cursor-pointer"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button className="h-8 sm:h-9 px-3 sm:px-5 rounded-full bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] text-white font-black text-[9px] sm:text-[10px] hover:opacity-90 transition-all active:scale-95 shadow-[0_0_15px_rgba(166,95,255,0.3)] border-none whitespace-nowrap">
                SIGN IN
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
