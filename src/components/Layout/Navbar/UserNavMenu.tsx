"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { NavSession } from "@/lib/nav/types";
import { cn } from "@/lib/utils";

export function UserNavMenu({
  session,
  variant = "navbar",
}: {
  session: NavSession;
  variant?: "navbar" | "light";
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const initials = session.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const dashboardHref = session.role === "ADMIN" ? "/admin" : "/dashboard";
  const dashboardLabel = session.role === "ADMIN" ? "Admin panel" : "Dashboard";

  const isLight = variant === "light";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-left transition",
          isLight
            ? "border border-navy/10 bg-white shadow-sm hover:bg-navy/5"
            : "border border-white/15 bg-white/5 hover:bg-white/10",
          open && (isLight ? "ring-2 ring-btnBg/20" : "bg-white/10 ring-2 ring-white/20"),
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-btnBg to-accent text-sm font-bold text-white shadow-sm">
          {session.avatarUrl ? (
            <Image
              src={session.avatarUrl}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            initials || "U"
          )}
        </span>
        <span
          className={cn(
            "hidden max-w-[7rem] truncate text-sm font-semibold lg:block",
            isLight ? "text-navy" : "text-white",
          )}
        >
          {session.fullName.split(" ")[0]}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 transition lg:block",
            isLight ? "text-navy/50" : "text-white/70",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-2xl"
          >
            <div className="border-b border-navy/8 bg-[#f7f9fc] px-4 py-3.5">
              <p className="truncate text-sm font-semibold text-navy">{session.fullName}</p>
              <p className="truncate text-xs text-navy/50">{session.email}</p>
              {session.studentId ? (
                <p className="mt-1 inline-flex rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-accent">
                  ID {session.studentId}
                </p>
              ) : null}
            </div>

            <div className="p-2">
              <Link
                href={dashboardHref}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy transition hover:bg-btnBg/8 hover:text-btnBg"
              >
                {session.role === "ADMIN" ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                {dashboardLabel}
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={() => void logout()}
                disabled={pending}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {pending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
