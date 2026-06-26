"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";

type AnnouncementProps = {
  announcement: {
    id: string;
    text: string;
    badge: string | null;
    ctaText: string | null;
    ctaLink: string | null;
    bgGradient: string;
    textColor: string;
  };
};

export default function AnnouncementBar({ announcement }: AnnouncementProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasCheckedDismissed, setHasCheckedDismissed] = useState(false);

  const storageKey = `educare-announcement-dismissed-${announcement.id}`;

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey) === "true";
    if (!dismissed) {
      setIsVisible(true);
    }
    setHasCheckedDismissed(true);
  }, [storageKey]);

  function handleDismiss() {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
  }

  // Prevent rendering anything during SSR or before we verify localstorage
  // to avoid hydration mismatch flashes if dismissed.
  if (!hasCheckedDismissed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className={`w-full bg-gradient-to-r ${announcement.bgGradient} ${announcement.textColor} relative z-[60] overflow-hidden border-b border-white/10`}
      >
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Announcement message and CTA */}
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center text-xs sm:text-sm font-medium">
              {announcement.badge && (
                <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm animate-pulse">
                  {announcement.badge}
                </span>
              )}
              <span className="leading-relaxed">{announcement.text}</span>
              {announcement.ctaText && announcement.ctaLink && (
                <Link
                  href={announcement.ctaLink}
                  className="inline-flex items-center justify-center bg-white text-navy px-3 py-1 rounded-full text-xs font-bold hover:bg-opacity-95 active:scale-95 hover:shadow-md transition-all duration-200 whitespace-nowrap ml-1"
                >
                  {announcement.ctaText}
                </Link>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 shrink-0"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
