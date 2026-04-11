"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  Wallet,
  Vault,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileInitial, setProfileInitial] = useState("U");

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/wallet", { cache: "no-store" });

        if (!response.ok) {
          await fetch("/api/auth/logout", { method: "POST" });
          router.replace("/auth/login");
          return;
        }

        const data = await response.json();
        const email = data?.wallet?.email;
        if (typeof email === "string" && email.length > 0) {
          setProfileInitial(email.charAt(0).toUpperCase());
        }

        setLoading(false);
      } catch (error) {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/auth/login");
      }
    };

    validateSession();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.replace("/auth/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/app/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Receive",
      href: "/app/receive",
      icon: Send,
    },
    {
      label: "Spend",
      href: "/app/spend",
      icon: Wallet,
    },
    {
      label: "Savings",
      href: "/app/savings",
      icon: Vault,
    },
    {
      label: "Insights",
      href: "/app/insights",
      icon: TrendingUp,
    },
    {
      label: "Flex Mode",
      href: "/app/flex-mode",
      icon: Zap,
    },
    {
      label: "Settings",
      href: "/app/settings",
      icon: Settings,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl font-bold text-primary-foreground">
              ₦
            </span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 shrink-0 border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 md:h-screen md:overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="border-b border-sidebar-border/80 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent hero-glow">
              <span className="text-xl font-bold text-primary-foreground">₦</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">
                NairaFlow
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Monad-native savings rail</p>
            </div>
          </div>

          <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/40 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/55">Testing mode</p>
            <p className="mt-2 text-sm font-medium text-sidebar-foreground">
              Full flow testing enabled.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-sidebar-border/80 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sidebar-foreground/85 transition hover:bg-sidebar-accent"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl p-2 text-foreground transition hover:bg-muted md:hidden"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <div className="flex-1 text-center md:flex-none md:text-left">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Savings cockpit</p>
            <h2 className="text-lg font-semibold text-foreground">NairaFlow</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground md:block">
              Built for live demo impact
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90" title="Profile">
              <span className="text-sm font-semibold">{profileInitial}</span>
            </button>
          </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
