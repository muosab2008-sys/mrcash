"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gift,
  Users,
  Wallet,
  Settings,
  ArrowLeft,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Offers", href: "/admin/offers", icon: Gift },
  { title: "Partners", href: "/admin/partners", icon: Sparkles },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Back to Main Site */}
          <div className="mt-8 border-t border-border pt-4">
            <Link
              href="/earn"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Site
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-6">{children}</main>
    </div>
  );
}
