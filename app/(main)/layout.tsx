"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { TopEarnersBar } from "@/components/layout/top-earners-bar";

// Mock user for demo - in real app this would come from auth context
const mockUser = null; // Set to object to simulate logged-in user

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState(mockUser);

  const handleSignOut = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Earners Bar */}
        <TopEarnersBar />

        {/* Header */}
        <AppHeader
          user={
            user
              ? { name: "Demo User", avatar: "avatar-1", balance: 0 }
              : null
          }
          onSignOut={handleSignOut}
        />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-8rem)] p-4 lg:p-6">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 px-4 py-8 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">
                    $
                  </span>
                </div>
                <span className="text-lg font-bold">Mr. Cash</span>
              </div>

              {/* Links */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">About</h4>
                  <ul className="space-y-1">
                    <li>
                      <a href="/terms" className="hover:text-primary">
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="/privacy" className="hover:text-primary">
                        Privacy Policy
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">Pages</h4>
                  <ul className="space-y-1">
                    <li>
                      <a href="/cashout" className="hover:text-primary">
                        Cashout
                      </a>
                    </li>
                    <li>
                      <a href="/affiliates" className="hover:text-primary">
                        Affiliates
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              © 2026 Mr. Cash. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
