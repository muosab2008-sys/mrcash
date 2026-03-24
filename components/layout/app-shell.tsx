"use client";

import { useState, ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import Footer from "@/components/Footer"; // استيراد الفوتر الجديد

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col lg:flex-row bg-background text-white overflow-hidden">
      
      {/* Sidebar - القائمة الجانبية */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main content area - منطقة المحتوى الرئيسية */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        
        {/* Header - الهيدر العلوي */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />

        {/* Main content - المحتوى القابل للتمرير */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0 bg-[#050505]">
          <div className="w-full min-h-full flex flex-col"> {/* أضفت flex-col هنا لضمان دفع الفوتر للأسفل */}
            
            <div className="mx-auto max-w-full px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 flex-1">
              {children}
            </div>

            {/* --- إضافة الفوتر هنا ليظهر في كل الصفحات --- */}
            <Footer />

          </div>
        </main>
      </div>

      {/* Bottom navigation - شريط التنقل السفلي للموبايل */}
      <BottomNav />
    </div>
  );
}
