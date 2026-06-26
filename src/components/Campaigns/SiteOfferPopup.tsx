"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Gift, Sparkles, X, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ActiveCampaign = {
  id: string;
  title: string;
  content: string;
  badge: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  frequency: "ONCE_PER_CAMPAIGN" | "ONCE_PER_SESSION" | "EVERY_VISIT";
  endsAt: string | null;
  updatedAt: string;
  
  // Premium fields
  originalPrice: number | null;
  salePrice: number | null;
  countdownEndsAt: string | null;
  theme: string; // "LIGHT" | "DARK_ROYAL" | "DARK_MYSTIC"
};

const EXCLUDED_PREFIXES = [
  "/admin",
  "/learn",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
];

function storageKey(campaign: ActiveCampaign) {
  return `broad-academy:popup-dismissed:${campaign.id}:${campaign.updatedAt}`;
}

function hasBeenDismissed(campaign: ActiveCampaign) {
  try {
    if (campaign.frequency === "ONCE_PER_CAMPAIGN") {
      return localStorage.getItem(storageKey(campaign)) === "1";
    }
    if (campaign.frequency === "ONCE_PER_SESSION") {
      return sessionStorage.getItem(storageKey(campaign)) === "1";
    }
  } catch {
    return false;
  }
  return false;
}

function rememberDismissal(campaign: ActiveCampaign) {
  try {
    if (campaign.frequency === "ONCE_PER_CAMPAIGN") {
      localStorage.setItem(storageKey(campaign), "1");
    } else if (campaign.frequency === "ONCE_PER_SESSION") {
      sessionStorage.setItem(storageKey(campaign), "1");
    }
  } catch {
    // Storage can be disabled by privacy settings. Closing still works for this view.
  }
}

export default function SiteOfferPopup() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const [open, setOpen] = useState(false);
  
  const excluded = useMemo(
    () => EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname],
  );
  const visible = open && !excluded;

  const close = useCallback(() => {
    if (campaign) rememberDismissal(campaign);
    setOpen(false);
  }, [campaign]);

  useEffect(() => {
    if (excluded) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/popup-campaigns/active", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { campaign?: ActiveCampaign | null };
        };
        const nextCampaign = payload.data?.campaign ?? null;
        if (!response.ok || !nextCampaign || hasBeenDismissed(nextCampaign)) return;
        setCampaign(nextCampaign);
        setOpen(true);
      } catch {
        // Promotions should never block or break the page.
      }
    }, 1500); // Wait a bit longer to feel more premium and natural

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [excluded]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, visible]);

  if (!visible || !campaign) return null;

  const isDark = campaign.theme === "DARK_ROYAL" || campaign.theme === "DARK_MYSTIC";
  const bgThemeClass = 
    campaign.theme === "DARK_ROYAL" 
      ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-navy text-white" 
      : campaign.theme === "DARK_MYSTIC"
        ? "bg-black text-white"
        : "bg-white text-navy";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-offer-title"
          aria-describedby="site-offer-content"
          initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className={`relative grid max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border ${
            isDark ? "border-white/15" : "border-slate-200"
          } ${bgThemeClass} shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:overflow-hidden md:grid-cols-[0.92fr_1.08fr]`}
        >
          {/* Close Button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className={`absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border ${
              isDark ? "border-white/20 bg-white/10 hover:bg-white/20 text-white" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            } shadow-md transition-all duration-200 hover:rotate-90`}
            aria-label="Close offer"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* Left Pane - Visual */}
          {campaign.imageUrl ? (
            <div className="relative min-h-52 overflow-hidden bg-navy md:min-h-[490px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={campaign.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              {campaign.badge && (
                <div className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
                  {campaign.badge}
                </div>
              )}
            </div>
          ) : (
            /* Left Pane - Premium Branded Gradient Placeholder if no image */
            <div className={`relative min-h-52 overflow-hidden md:min-h-[490px] flex items-center justify-center ${
              campaign.theme === "DARK_ROYAL"
                ? "bg-gradient-to-br from-indigo-900 via-purple-950 to-violet-900 text-white"
                : campaign.theme === "DARK_MYSTIC"
                  ? "bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white"
                  : "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white"
            }`}>
              <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,white_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
              
              <div className="relative text-center flex flex-col items-center p-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-[30px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md mb-4">
                  <Gift className="h-10 w-10 text-yellow-300" strokeWidth={1.5} />
                </div>
                {campaign.badge && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                    {campaign.badge}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Right Pane - Content */}
          <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 overflow-hidden">
            {/* Custom Glowing Background Blobs */}
            {isDark ? (
              <>
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-600/15 blur-[60px]" />
                <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-indigo-600/15 blur-[60px]" />
              </>
            ) : (
              <>
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-100/40 blur-3xl" />
                <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-sky-100/40 blur-3xl" />
              </>
            )}

            <div className="relative z-10">
              {/* Campaign Badge */}
              {campaign.badge && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ${
                  isDark ? "bg-white/10 text-white border border-white/10" : "bg-emerald-50 text-emerald-700"
                }`}>
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                  {campaign.badge}
                </span>
              )}

              {/* Title */}
              <h2
                id="site-offer-title"
                className={`mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl ${
                  isDark ? "text-white" : "text-navy"
                }`}
              >
                {campaign.title}
              </h2>

              {/* Content */}
              <p
                id="site-offer-content"
                className={`mt-4 whitespace-pre-line text-sm leading-7 sm:text-base ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {campaign.content}
              </p>

              {/* Prices Block (Reference Image Style) */}
              {(campaign.originalPrice || campaign.salePrice) && (
                <div className="mt-6 flex items-center gap-4 flex-wrap">
                  {campaign.originalPrice && (
                    <span className="text-slate-400 text-lg line-through font-medium">
                      ৳{campaign.originalPrice}
                    </span>
                  )}
                  {campaign.salePrice && (
                    <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-2xl font-black px-4 py-1.5 rounded-full shadow-lg border border-white/10 inline-flex items-center justify-center">
                      ৳{campaign.salePrice}
                    </span>
                  )}
                  {campaign.originalPrice && campaign.salePrice && (
                    <span className="text-xs font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                      Save ৳{campaign.originalPrice - campaign.salePrice}
                    </span>
                  )}
                </div>
              )}

              {/* Countdown Timer Block (Reference Image Style) */}
              {campaign.countdownEndsAt && (
                <div className="mt-6 pt-5 border-t border-dashed border-slate-700/30">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
                    Limited Time Remaining
                  </div>
                  <CountdownTimer targetDate={campaign.countdownEndsAt} isDark={isDark} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {campaign.ctaText && campaign.ctaLink ? (
                  campaign.ctaLink.startsWith("/") ? (
                    <Link
                      href={campaign.ctaLink}
                      onClick={close}
                      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                        isDark 
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-indigo-600/20" 
                          : "bg-navy text-white hover:bg-navy/90 shadow-navy/20"
                      }`}
                    >
                      {campaign.ctaText}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <a
                      href={campaign.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                        isDark 
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-indigo-600/20" 
                          : "bg-navy text-white hover:bg-navy/90 shadow-navy/20"
                      }`}
                    >
                      {campaign.ctaText}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )
                ) : null}
                <button
                  type="button"
                  onClick={close}
                  className={`min-h-12 rounded-2xl px-5 text-sm font-semibold transition-all ${
                    isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:bg-slate-100 hover:text-navy"
                  }`}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}

// Highly responsive countdown timer component in the exact style of the reference image
function CountdownTimer({ targetDate, isDark }: { targetDate: string; isDark: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const targetTime = new Date(targetDate).getTime();
    
    function updateTimer() {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsFinished(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (isFinished) {
    return <div className="text-sm font-bold text-red-500 uppercase">Offer has ended</div>;
  }

  const items = [
    { value: timeLeft.days, label: "Day" },
    { value: timeLeft.hours, label: "Hour" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <div className="flex gap-2 text-center">
      {items.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className={`min-w-[54px] px-2 py-2 rounded-xl font-black text-lg shadow-sm border ${
            isDark 
              ? "bg-white/5 border-white/10 text-cyan-300 shadow-cyan-500/5" 
              : "bg-slate-50 border-slate-200 text-indigo-600"
          }`}>
            {String(item.value).padStart(2, "0")}
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 mt-1 uppercase">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
