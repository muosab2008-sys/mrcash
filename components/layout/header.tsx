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
        
        {/* القسم الأيسر: زر القائمة + الشعار (يظهر للجميع) */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-white/5 text-white shrink-0 h-9 w-9"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* الشعار والاسم - يظهر في الجوال والكمبيوتر */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <Image 
              src="/logo.png" 
              alt="MrCash Logo"
              width={28} 
              height={28}
              priority
              className="object-contain w-7 h-7 sm:w-8 sm:h-8 shrink-0 transition-transform group-hover:scale-105"
            />
            
            {/* نص MrCash الملون بدون توهج */}
            <span className="text-xl sm:text-2xl font-black tracking-tighter inline-block italic font-sans">
              <span className="bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] bg-clip-text text-transparent">
                MrCash
              </span>
            </span>
          </Link>
        </div>

        {/* القسم الأيمن: الرصيد والإشعارات والإعدادات */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {user && userData ? (
            <>
              {/* عرض الرصيد - يظهر في كل الشاشات */}
              <div className="flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 sm:px-4 sm:py-2 border border-white/[0.1]">
                <Image 
                  src="/coin.png" 
                  alt="Coin" 
                  width={20} 
                  height={20} 
                  priority 
                  className="object-contain animate-pulse w-4 h-4 sm:w-5 sm:h-5 shrink-0" 
                />

                <span className="font-black text-xs sm:text-base text-white whitespace-nowrap">
                  {(userData?.points || 0) > 999999 ? `${(userData?.points / 1000000).toFixed(1)}M` : (userData?.points || 0).toLocaleString()}
                </span>
                
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-widest ml-0.5 shrink-0">
                  PTS
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
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-[#0A0A0A] border-white/10 text-white shadow-2xl p-2">
                    <div className="px-3 py-3 bg-white/[0.02] rounded-xl mb-1">
                      <p className="text-sm font-black text-white truncate">{userData?.username}</p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        Level {Math.floor((userData?.totalEarned || 0) / 10000) + 1} • ID: {userData?.uid?.slice(0, 6)}
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
              <Button className="h-9 px-5 rounded-full bg-gradient-to-r from-[#00D2FF] to-[#A65FFF] text-white font-black text-[10px] border-none active:scale-95 transition-all">
                SIGN IN
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
