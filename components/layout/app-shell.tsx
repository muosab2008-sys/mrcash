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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 1. السايد بار الجانبي ثابت على اليسار */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* 2. منطقة المحتوى الأيمن بالكامل */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* --- هنا الترتيب الجديد داخل الجزء الأيمن فقط --- */}
        
        {/* شريط الـ Live Feed في القمة (فوق الجرس فقط) */}
        <div className="w-full bg-[#050505] border-b border-white/5 py-1 z-50">
           <LiveFeed />
        </div>

        {/* الهيدر الذي يحتوي على الجرس والرصيد */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />

        {/* باقي محتوى الصفحة */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-[#050505]">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
