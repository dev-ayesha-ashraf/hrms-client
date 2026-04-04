"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employees" },
  { href: "/departments", label: "Departments" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leave-requests", label: "Leave Requests" },
  { href: "/payroll", label: "Payroll" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.name]);

  return (
    <div className={`app-shell ${sidebarCollapsed ? "app-shell-collapsed" : ""}`}>
      {mobileOpen && <button className="app-shell-overlay" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

      <aside className={`app-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="app-sidebar-header">
          <div className="app-brand-mark">HR</div>
          <div className="app-brand-copy">
            <p>HR Solutions</p>
            <span>Operations</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <NotificationBell />
          </div>
        </div>

        <nav className="app-sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`app-sidebar-link ${active ? "is-active" : ""}`}
                title={item.label}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="app-shell-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="app-icon-button app-mobile-only"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              Menu
            </button>
            <button
              type="button"
              className="app-icon-button app-desktop-only"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>

          <div className="app-user-panel">
            <NotificationBell />
            <div className="app-user-meta">
              <p>{user?.name}</p>
              <span>{user?.role}</span>
            </div>
            <div className="app-user-avatar" aria-label="User avatar">
              {initials}
            </div>
            <button type="button" className="app-button-ghost" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="app-shell-content">{children}</main>
      </div>
    </div>
  );
}
