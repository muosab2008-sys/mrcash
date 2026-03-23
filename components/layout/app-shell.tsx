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
    <div className="flex h-screen overflow-hidden bg-background text-white">
      {/* 1. السايد بار الجانبي ثابت */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* 2. منطقة المحتوى الأيمن */}
      <div className="flex flex-col flex-1 relative overflow-hidden">
        
        {/* --- الشريط المتحرك (Live Feed) --- */}
        {/* وضعه هنا بوضعية Absolute يضمن بقاءه في القمة فوق الهيدر والجرس */}
        <div className="w-full bg-[#050505] border-b border-white/5 py-1 z-[60]">
           <LiveFeed />
        </div>

        {/* 3. الهيدر (الذي يحتوي على الرصيد والجرس) */}
        <div className="relative z-50">
          <Header 
            onMenuClick={() => setSidebarOpen(true)} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isCollapsed={sidebarCollapsed}
          />
        </div>

        {/* 4. محتوى الصفحة الرئيسي */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-[#050505] relative z-10">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
