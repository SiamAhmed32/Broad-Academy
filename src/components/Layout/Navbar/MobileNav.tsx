"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { navActions, navLinks } from "@/components/data/navData";
import { BrandLogo } from "@/components/Brand";
import type { NavSession } from "@/lib/nav/types";
import { NavNotificationBell } from "./NavNotificationBell";
import { UserNavMenu } from "./UserNavMenu";

const MobileNav = ({ navSession }: { navSession: NavSession | null }) => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <BrandLogo inverse />
        <div className="flex items-center gap-2">
          {navSession ? (
            <>
              <UserNavMenu session={navSession} />
              <NavNotificationBell navSession={navSession} placement="mobile" />
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="rounded-xl border border-white/15 p-2.5 text-white transition hover:bg-white/5"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="absolute inset-x-3 top-[4.5rem] z-50 rounded-2xl border border-navy/10 bg-white p-3 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-navy transition hover:bg-btnBg/5 hover:text-btnBg"
            >
              {link.title}
            </Link>
          ))}
          {!navSession
            ? navActions.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-navy transition hover:bg-btnBg/5 hover:text-btnBg"
                >
                  {link.title}
                </Link>
              ))
            : null}
        </div>
      ) : null}
    </nav>
  );
};

export default MobileNav;
