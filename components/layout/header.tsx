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
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
        
        {/* القسم الأيسر: زر المنيو والشعار (للجوال فقط) */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-white/5 text-white shrink-0 h-9 w-9"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* الشعار والاسم: يختفي في الشاشات الكبيرة (lg:hidden) ويظهر في الجوال */}
          <Link href="/" className="lg:hidden flex items-center gap-2 min-w-0 group">
            <Image 
              src="/logo.png" 
              alt="MrCash Logo"
              width={26} 
              height={26}
              priority
              className="object-contain w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-transform group-hover:scale-105"
            />
            
            {/* Brand text with blue-purple gradient */}
            <span className="text-xl font-black tracking-tighter inline-block italic font-sans">
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                MrCash
              </span>
            </span>
          </Link>
        </div>

        {/* القسم الأيمن: الرصيد والإعدادات (يظهر للجميع) */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {user && userData ? (
            <>
              {/* Balance display - USD format */}
              <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 px-3 py-2 sm:px-4 sm:py-2.5 border border-[#3B82F6]/20 shadow-sm">
                <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6]">
                  <span className="text-white font-black text-xs sm:text-sm">$</span>
                </div>

                <span className="font-black text-sm sm:text-lg text-white whitespace-nowrap">
                  {((userData?.points || 0) / 1000).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <NotificationPanel />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5 text-white/50 h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl bg-[#0A0A0A] border-white/10 text-white shadow-2xl p-2 mt-1">
                    <div className="px-3 py-3 bg-white/[0.02] rounded-xl mb-1">
                      <p className="text-sm font-black text-white truncate">{userData?.username}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        LVL {Math.floor((userData?.totalEarned || 0) / 10000) + 1} • ID: {userData?.uid?.slice(0, 6)}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2.5 text-xs font-bold focus:bg-white/5 focus:text-[#A65FFF]">
                      <Link href="/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    {userData?.isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2.5 text-xs font-bold focus:bg-white/5 focus:text-[#00D2FF]">
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem 
                      onClick={logout} 
                      className="text-red-500 font-bold py-2.5 text-xs focus:text-red-400 focus:bg-red-500/5 cursor-pointer rounded-lg"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button className="h-8 sm:h-9 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold text-xs border-none active:scale-95 transition-all shadow-lg shadow-[#3B82F6]/20">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
