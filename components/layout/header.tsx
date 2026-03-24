"use client";

import Link from "next/link";
import Image from "next/image"; // استيراد مكون الصورة
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
        
        {/* القسم الأيسر: زر المنيو + الشعار المدمج (للجوال فقط) */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-white/5 text-white"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* الشعار الكامل: يظهر فقط في الجوال ويختفي في اللابتوب (lg:hidden) */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            
            {/* 1. الأيقونة الملونة (الأزرق والبنفسجي) من ملفك public */}
            <Image 
              src="/Untitled (2).png" // تأكد من أن هذا الاسم صحيح في مجلد public
              alt="MrCash Logo Icon"
              width={26} // حجم الصورة في الجوال
              height={26}
              priority
              className="object-contain"
            />
            
            {/* 2. اسم الموقع "MrCash" بتدرج ألوان متطابق (من الأزرق للبنفسجي) */}
            <span className="text-xl font-bold tracking-tighter">
              {/* تدرج اللون باستخدام Tailwind CSS */}
              <span className="bg-gradient-to-r from-[#00D2FF] via-[#A65FFF] to-[#E366FF] bg-clip-text text-transparent">
                MrCash
              </span>
            </span>
          </Link>
        </div>

        {/* القسم الأيمن: الرصيد (بصورة) والإعدادات (للجوال واللابتوب) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user && userData ? (
            <>
              {/* عرض الرصيد - تصميم الكبسولة الأنيق */}
              <div className="flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 border border-white/[0.08]">
                
                {/* استخدام صورة coin.png للرصيد في كل مكان (تأكد من وجود الملف في public) */}
                <Image 
                  src="/coin.png" 
                  alt="Coin" 
                  width={18} // حجم الصورة في الجوال
                  height={18} 
                  priority 
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
                    <DropdownMenuItem asChild className="cursor-pointer py-2.5 focus:bg-white/5 focus:text-[#A65FFF]">
                      <Link href="/profile">Profile Settings</Link>
                    </DropdownMenuItem>
                    {userData?.isAdmin && (
                      <DropdownMenuItem asChild className="cursor-pointer py-2.5 focus:bg-white/5 focus:text-[#A65FFF]">
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
              {/* زر تسجيل الدخول باللون البنفسجي للزمان */}
              <Button className="h-9 px-5 rounded-full bg-[var(--brand-purple)] text-white font-black text-[10px] hover:bg-[var(--brand-purple)]/90 transition-all active:scale-95">
                SIGN IN
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
