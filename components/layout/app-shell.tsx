"use client";

import { useState, ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { LiveFeed } from "@/components/live-feed";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    // أزلنا h-screen و overflow-hidden لجعل الصفحة تتمدد طبيعياً
    <div className="flex min-h-screen bg-background text-white">
      
      {/* 1. السايد بار الجانبي */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* 2. منطقة المحتوى الأيمن - جعلناها تأخذ الطول الكامل */}
      <div className="flex flex-col flex-1 min-w-0">
        
        {/* الهيدر في الأعلى (الجرس والرصيد) */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />

        {/* شريط الـ Live Feed تحت الهيدر مباشرة */}
      {/* <div className="w-full bg-[#050505] border-b border-white/5 py-1 z-40">
    <LiveFeed />
</div> */}

        {/* 3. محتوى الصفحة الرئيسي - ينزل مع الصفحة بشكل طبيعي */}
        <main className="flex-1 pb-20 lg:pb-10 bg-[#050505]">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
