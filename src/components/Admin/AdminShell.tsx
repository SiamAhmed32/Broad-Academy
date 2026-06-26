"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/components/Brand";
import AdminLogoutButton from "@/components/Admin/AdminLogoutButton";
import { NotificationBell } from "@/components/Layout/Navbar/NotificationBell";
import {
  ADMIN_ROLE_LABELS,
  getPermissionsForUser,
  resolveAdminRole,
  type AdminUser,
} from "@/lib/admin/permissions";
import { adminNavGroups, adminNavItems } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  user: AdminUser;
  initialUnreadCount?: number;
  children: React.ReactNode;
};

export default function AdminShell({
  user,
  initialUnreadCount = 0,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const permissions = useMemo(() => getPermissionsForUser(user), [user]);
  const roleLabel = ADMIN_ROLE_LABELS[resolveAdminRole(user.adminRole)];

  const visibleNav = useMemo(
    () => adminNavItems.filter((item) => permissions.includes(item.permission)),
    [permissions],
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}>
        <BrandLogo compact={collapsed} href="/admin" inverse />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Admin Panel
            </p>
            <p className="truncate text-[11px] text-white/50">{roleLabel}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {adminNavGroups.map((group) => {
          const items = visibleNav.filter((item) => item.group === group.id);
          if (items.length === 0) return null;

          return (
            <div key={group.id}>
              {!collapsed ? (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                          active
                            ? "bg-white/12 text-white shadow-sm"
                            : "text-white/65 hover:bg-white/8 hover:text-white",
                          collapsed && "justify-center px-2",
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-accent" : "text-white/50 group-hover:text-accent",
                          )}
                        />
                        {!collapsed ? <span>{item.label}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className={cn(
            "mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 transition hover:bg-white/8 hover:text-white",
            collapsed && "justify-center px-2",
          )}
        >
          <ExternalLink className="h-4 w-4" />
          {!collapsed ? "View Website" : null}
        </Link>
        <AdminLogoutButton collapsed={collapsed} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-navy text-soft transition-all duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-[270px]",
        )}
      >
        {sidebarContent}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-navy shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-navy transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-4 rounded-lg p-2 text-white/70 hover:bg-white/10"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[270px]",
        )}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 p-2 text-navy lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm font-semibold text-navy">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell
                variant="light"
                initialUnreadCount={initialUnreadCount}
              />
              <AdminBadge role={roleLabel} />
            </div>
          </div>
        </header>

        <motion.main
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="px-4 py-6 sm:px-6 sm:py-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

function AdminBadge({ role }: { role: string }) {
  return (
    <span className="hidden rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent sm:inline-flex">
      {role}
    </span>
  );
}
