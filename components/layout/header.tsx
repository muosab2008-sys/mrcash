"use client";

import Link from "next/link";
import Image from "next/image"; // استيراد مكون الصورة من Next.js
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#050505]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* القسم الأيسر: زر المنيو للجوال فقط */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-white/5 text-white"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* اللابتوب لم يتغير: الشعار لا يظهر هنا لأنه موجود في السايد بار الأيسر */}
        </div>

        {/* القسم الأيمن: الرصيد (بصورة coin.png) والإعدادات (للجوال واللابتوب) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user && userData ? (
            <>
              {/* عرض الرصيد - تصميم الكبسولة الأنيق */}
              <div className="flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 border border-white/[0.08]">
                
                {/* استبدال الأيقونة بصورة coin.png (تظهر في الجوال واللابتوب) */}
                {/* تأكد من وجود ملف coin.png في مجلد public */}
                <Image 
                  src="/coin.png" 
                  alt="Coin" 
                  width={18} // حجم الصورة في الجوال
                  height={18} 
                  priority // لضمان تحميل الصورة بسرعة
                  className="object-contain animate-pulse sm:w-5 sm:h-5" // حجم الصورة في اللابتوب
                />

                <span className="font-bold text-xs sm:text-sm text-white">
                  {userData?.points?.toLocaleString() || "0"}
                </span>
                
                {/* كلمة Points تظهر فقط في الشاشات المتوسطة فما فوق (md:inline) */}
                <span className="hidden md:inline text-[10px] text-white/40 font-medium uppercase tracking-widest ml-1">
                  Points
                </span>
              </div>

              <div className="flex items-center gap-1">
                <NotificationPanel />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-white/5 text-white/50">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-[#0A0A0A] border-white/10 text-white shadow-2xl">
                    <div className="px-4 py-3">
                      <p className="text-sm font-bold text-white/90">{userData?.username}</p>
                      <p className="text-[11px] text-white/40">
                        Level {userData?.level || 1} • ID: {userData?.uid?.slice(0, 8)}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 focus:bg-white/5 focus:text-[#00E676]">
                      <Link href="/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    {userData?.isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer py-2.5 focus:bg-white/5 focus:text-[#00E676]">
                        <Link href="/admin">Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem 
                      onClick={logout} 
                      className="text-red-500 py-2.5 focus:text-red-400 focus:bg-red-500/5 cursor-pointer"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button className="h-9 px-5 rounded-full bg-[#00E676] text-black font-black text-[10px] hover:bg-[#00c864] transition-all">
                SIGN IN
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
