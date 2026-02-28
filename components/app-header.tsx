"use client";

import { useAuth } from "@/lib/auth-context";
import { DollarSign, LogOut, Menu, X, User } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/offers", label: "Offers" },
  { href: "/withdraw", label: "Withdraw" },
];

export function AppHeader() {
  const { user, balance, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  if (!user) return null;

  const initial = (user.displayName || user.email || "U").charAt(0).toUpperCase();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center neon-glow">
              <DollarSign className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:block">
              Mr <span className="text-primary">Cash</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{balance.toLocaleString()}</span>
          </div>

          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{initial}</span>
          </div>

          <button
            onClick={logout}
            className="hidden md:flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>

          <button
            className="md:hidden text-muted-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-border pb-3">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground font-medium truncate">
              {user.displayName || user.email}
            </span>
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              logout();
              setMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-secondary transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
