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
    <div className="flex min-h-screen flex-col bg-background">
      
      {/* 1. هذا هو التعديل: الـ Live Feed صار في القمة تماماً */}
      <div className="w-full bg-[#050505] border-b border-white/5 py-1 z-50">
         <LiveFeed />
      </div>

      {/* 2. الهيدر (اللي فيه الجرس والرصيد) صار تحته مباشرة */}
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isCollapsed={sidebarCollapsed}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* السايد بار الجانبي */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
        />

        {/* منطقة المحتوى الرئيسي */}
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
