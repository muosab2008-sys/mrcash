"use client";

import { useAuth } from "@/lib/auth-context";
import { LandingPage } from "./landing-page";
import { AppHeader } from "./app-header";
import { LiveTicker } from "./live-ticker";
import { BalanceNotifier } from "./balance-notifier";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LiveTicker />
      <AppHeader />
      <main className="flex-1">{children}</main>
      <BalanceNotifier />
    </div>
  );
}
