"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, LogOut, Shield, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { navActions, navLinks } from "@/components/data/navData";
import { BrandLogo } from "@/components/Brand";
import { SheetClose } from "@/components/ui/sheet";
import type { NavSession } from "@/lib/nav/types";
import { cn } from "@/lib/utils";

type MobileMenuDrawerProps = {
  navSession: NavSession | null;
  onNavigate: () => void;
};

export function MobileMenuDrawer({ navSession, onNavigate }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [signingOut, setSigningOut] = useState(false);

  const dashboardHref = navSession?.role === "ADMIN" ? "/admin" : "/dashboard";
  const dashboardLabel = navSession?.role === "ADMIN" ? "Admin" : "Dashboard";

  const initials =
    navSession?.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") ?? "";

  async function logout() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      onNavigate();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-navy px-4 py-3">
        <BrandLogo inverse compact />
        <SheetClose
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/25"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </SheetClose>
      </header>

      {navSession ? (
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-btnBg to-accent text-xs font-bold text-white">
              {navSession.avatarUrl ? (
                <Image
                  src={navSession.avatarUrl}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                initials || "U"
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">{navSession.fullName}</p>
              <p className="truncate text-xs text-slate-500">{navSession.email}</p>
            </div>
            <Link
              href={dashboardHref}
              onClick={onNavigate}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white"
            >
              {navSession.role === "ADMIN" ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <LayoutDashboard className="h-3.5 w-3.5" />
              )}
              {dashboardLabel}
            </Link>
          </div>
        </div>
      ) : null}

      <motion.nav
        aria-label="Mobile navigation"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <ul>
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-12 items-center rounded-xl px-4 text-[15px] font-medium transition",
                    active
                      ? "bg-btnBg/8 font-semibold text-btnBg"
                      : "text-navy hover:bg-slate-50 active:bg-slate-100",
                  )}
                >
                  {active ? (
                    <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-btnBg" />
                  ) : null}
                  {link.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.nav>

      <footer className="shrink-0 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {navSession ? (
          <button
            type="button"
            onClick={() => void logout()}
            disabled={signingOut}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={navActions[0].href}
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-navy transition hover:bg-slate-50"
            >
              Log in
            </Link>
            <Link
              href={navActions[1].href}
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-btnBg text-sm font-semibold text-white transition hover:bg-btnBg/90"
            >
              Get started
            </Link>
          </div>
        )}
      </footer>
    </div>
  );
}
