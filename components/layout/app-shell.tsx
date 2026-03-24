"use client";

import { useState, ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col lg:flex-row bg-background text-white overflow-hidden">
      
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        
        {/* Header - Sticky at top */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />

        {/* Main content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0 bg-[#050505]">
          <div className="w-full h-full">
            <div className="mx-auto max-w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom navigation - Mobile only */}
      <BottomNav />
    </div>
  );
}
