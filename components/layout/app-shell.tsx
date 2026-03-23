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
      {/* الهيدر الأساسي الذي يحتوي على الرصيد */}
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isCollapsed={sidebarCollapsed}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 bg-[#050505]">
          
          {/* --- هذا هو المكان الجديد للشريط --- */}
          {/* وضعناه هنا ليكون تحت الرصيد مباشرة وبنفس المحاذاة */}
          <div className="w-full border-b border-white/5 bg-[#0d0d0d]/40 backdrop-blur-md">
             <LiveFeed />
          </div>

          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
