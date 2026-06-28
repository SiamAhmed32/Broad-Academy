"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { BrandLogo } from "@/components/Brand";
import { MobileMenuDrawer } from "@/components/Layout/Navbar/MobileMenuDrawer";
import { NavNotificationBell } from "@/components/Layout/Navbar/NavNotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { NavSession } from "@/lib/nav/types";
import { cn } from "@/lib/utils";

function MenuToggle({ open }: { open: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="absolute h-0.5 w-5 rounded-full bg-white"
          initial={false}
          animate={
            open
              ? index === 0
                ? { rotate: 45, y: 0 }
                : index === 1
                  ? { opacity: 0, scaleX: 0 }
                  : { rotate: -45, y: 0 }
              : {
                  rotate: 0,
                  y: index === 0 ? -6 : index === 2 ? 6 : 0,
                  opacity: 1,
                  scaleX: 1,
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.24, ease: [0.32, 0.72, 0, 1] }
          }
          style={{ transformOrigin: "center" }}
        />
      ))}
    </span>
  );
}

const MobileNav = ({ navSession }: { navSession: NavSession | null }) => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="md:hidden" aria-label="Mobile site header">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <BrandLogo inverse compact />

        <div className="flex items-center gap-1.5">
          {navSession ? (
            <NavNotificationBell navSession={navSession} placement="mobile" />
          ) : null}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl border transition",
                  open
                    ? "border-white/25 bg-white/15 text-white"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                <MenuToggle open={open} />
              </button>
            </SheetTrigger>

            <SheetContent className="p-0">
              <MobileMenuDrawer
                navSession={navSession}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
