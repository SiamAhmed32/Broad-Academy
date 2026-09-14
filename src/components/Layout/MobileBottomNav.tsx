"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, BookOpen, Ellipsis, LayoutGrid, X } from "lucide-react";

import NotificationsModal from "@/components/Layout/Navbar/NotificationsModal";
import { useNotificationBell } from "@/components/Layout/Navbar/useNotificationBell";

/**
 * The bar's silhouette, drawn once at 375x92 and centred on the bar; only the
 * middle ~114px strip is ever visible (see .bnav__cradle), so the fixed width
 * is irrelevant at any viewport.
 *
 * Top corners r=18. The flat top edge runs to x=142, then an 8px convex fillet
 * drops to (150,8). Pocket walls at x=150 and x=225 down to y=21, curving in to
 * a 35px floor at y=46. Mirrored fillet back up at (233,0).
 */
const CRADLE_PATH =
  "M150 8A8 8 0 0 0 142 0H18A18 18 0 0 0 0 18V74H375V18A18 18 0 0 0 357 0H233A8 8 0 0 0 225 8V21C225 35 219 46 205 46H170C156 46 150 35 150 21V8Z";

type TabItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const coursesTab: TabItem = { title: "Courses", href: "/courses", icon: BookOpen };

/** Right of the centre logo — "More" is a toggle, not a link. */
const rightTab: TabItem = {
  title: "Dashboard",
  href: "/dashboard",
  icon: LayoutGrid,
};

type MoreLink = {
  title: string;
  subtitle: string;
  href: string;
};

/**
 * Overflow menu. Deliberately holds nothing that is already a bar slot
 * (/, /courses, /dashboard) so the drawer never repeats the bar. Exams lives
 * here rather than in the bar: the bar's second slot is Notifications.
 */
const moreLinks: MoreLink[] = [
  { title: "Exams", subtitle: "Competitions and mock tests", href: "/exams" },
  { title: "About Us", subtitle: "Our mission, story and results", href: "/about" },
  {
    title: "Our Team",
    subtitle: "Meet the instructors and mentors",
    href: "/instructors",
  },
  {
    title: "Counselling",
    subtitle: "Book a free guidance session",
    href: "/counselling",
  },
  { title: "Contact Us", subtitle: "Phone, email and office hours", href: "/contact" },
];

const moreLegalLinks: MoreLink[] = [
  {
    title: "Privacy Policy",
    subtitle: "How we handle your data",
    href: "/privacy-policy",
  },
  {
    title: "Terms & Conditions",
    subtitle: "Rules for using the platform",
    href: "/terms-and-conditions",
  },
  { title: "Refund Policy", subtitle: "Cancellations and refunds", href: "/refund-policy" },
];

/**
 * App-shell and single-purpose routes that own their own bottom edge.
 * Matched on an exact-or-boundary basis so "/register" can never also
 * swallow a future "/registers".
 */
const HIDDEN_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/newsletter/unsubscribe",
  "/learn",
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Detail pages under /courses and /exams each render their own
 * `fixed bottom-0 z-50` enrol / start-exam CTA bar below 1024px, which would
 * sit in exactly the same band as this nav. Their CTA owns the bottom edge;
 * the index routes keep the bar.
 */
function hasOwnBottomCta(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return false;
  return segments[0] === "courses" || segments[0] === "exams";
}

/** The proctored exam runner: its own footer holds Prev/Next/Finish, and site
 *  nav would hand a student mid-attempt an escape route. */
function isExamRunner(pathname: string) {
  return /^\/exams\/[^/]+\/take$/.test(pathname);
}

function shouldHide(pathname: string) {
  return (
    HIDDEN_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix)) ||
    isExamRunner(pathname) ||
    hasOwnBottomCta(pathname)
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return matchesPrefix(pathname, href);
}

function NavTab({
  item,
  active,
  onNavigate,
}: {
  item: TabItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="bnav__link"
      data-active={active}
      // the active tab is otherwise conveyed only by colour and a 4px dot
      aria-current={active ? "page" : undefined}
      // tapping the tab for the route you are already on does not change
      // pathname, so the render-time close would never fire
      onClick={onNavigate}
    >
      <span className="relative">
        <Icon className="bnav__icon" strokeWidth={1.5} aria-hidden="true" />
        <span className="bnav__dot" aria-hidden="true" />
      </span>
      <span className="bnav__label">{item.title}</span>
    </Link>
  );
}

/**
 * The bar's second slot, always present so the five slots never shift about.
 *
 * Whoever can actually read the inbox gets the panel toggle; everyone else
 * gets a plain link instead of a dead button — and, importantly, no polling,
 * since the inbox API would 401 every POLL_MS for a signed-out visitor.
 */
function NotificationTab({
  canViewNotifications,
  signedIn,
  initialUnreadCount,
  onOpen,
}: {
  canViewNotifications: boolean;
  signedIn: boolean;
  initialUnreadCount: number;
  onOpen: () => void;
}) {
  const { anchorRef, open, setOpen, unreadCount, setUnreadCount, handleOpen } =
    useNotificationBell(canViewNotifications, initialUnreadCount);

  if (!canViewNotifications) {
    return (
      <Link
        href={signedIn ? "/dashboard" : "/login?next=/dashboard"}
        className="bnav__link"
        onClick={onOpen}
      >
        <span className="relative">
          <Bell className="bnav__icon" strokeWidth={1.5} aria-hidden="true" />
          <span className="bnav__dot" aria-hidden="true" />
        </span>
        <span className="bnav__label">Alerts</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        ref={anchorRef}
        className="bnav__link"
        data-active={open}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => {
          onOpen();
          handleOpen();
        }}
      >
        <span className="relative">
          <Bell className="bnav__icon" strokeWidth={1.5} aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-navy">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
          <span className="bnav__dot" aria-hidden="true" />
        </span>
        <span className="bnav__label">Alerts</span>
      </button>

      {open ? (
        <NotificationsModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onUnreadChange={setUnreadCount}
          anchorRef={anchorRef}
        />
      ) : null}
    </>
  );
}

function MoreRow({
  link,
  active,
  onNavigate,
}: {
  link: MoreLink;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 transition-colors ${
        active ? "bg-btnBg/8" : "active:bg-btnBg/10"
      }`}
    >
      <span>
        <span className={`block text-base font-semibold ${active ? "text-btnBg" : "text-navy"}`}>
          {link.title}
        </span>
        <span className={`mt-0.5 block text-sm ${active ? "text-btnBg/70" : "text-neutral-500"}`}>
          {link.subtitle}
        </span>
      </span>
      {active ? (
        <span className="h-2 w-2 rounded-full bg-btnBg" aria-hidden="true" />
      ) : null}
    </Link>
  );
}

export default function MobileBottomNav({
  canViewNotifications,
  signedIn,
  initialUnreadCount,
}: {
  canViewNotifications: boolean;
  signedIn: boolean;
  initialUnreadCount: number;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const hidden = shouldHide(pathname);

  /** Closing returns focus to the trigger; otherwise it falls to <body>. */
  const closeMore = useCallback(() => {
    setMoreOpen(false);
    moreButtonRef.current?.focus();
  }, []);

  // Close on navigation — including browser back/forward, which no click
  // handler sees. Adjusting state during render (rather than in an effect)
  // is React's recommended pattern for reacting to a changed input.
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setMoreOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // defaultPrevented: another open layer (a modal, a combobox) has already
      // handled this Escape, so it is not ours to act on.
      if (event.key === "Escape" && !event.defaultPrevented) closeMore();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen, closeMore]);

  if (hidden) return null;

  return (
    <>
      {/* Spacer lives with the bar, so reserved space and bar visibility can
          never drift apart; height comes from the same --bnav-* values as the
          bar's own padding. */}
      <div aria-hidden="true" className="bnav-spacer md:hidden" />

      {/* Scrim is a SIBLING of the bar's wrapper and sits below it, so
          backdrop-filter blurs the page rather than the drawer. Kept mounted
          and toggled by data-open so it can animate out as well as in. */}
      <div
        className="bnav__scrim z-[59] md:hidden"
        data-open={moreOpen}
        onClick={closeMore}
        aria-hidden="true"
      />

      <div className="fixed inset-x-0 bottom-0 z-[60] md:hidden">
        {/* DOM order matters: the bar comes first for tab order, the panel
            second so it paints underneath at a lower z-index. */}
        <nav className="bnav" aria-label="Quick links">
          <span className="bnav__bg" aria-hidden="true" />

          <span className="bnav__cradle" aria-hidden="true">
            <svg width="375" height="74" viewBox="0 0 375 74" fill="none" focusable="false">
              <defs>
                <clipPath id="bnavCradleInterior">
                  <path d={CRADLE_PATH} />
                </clipPath>
              </defs>

              {/* the moulded surface; fill comes from .bnav__cradle-surface */}
              <path className="bnav__cradle-surface" d={CRADLE_PATH} />

              {/* Rim light. The same contour, stroked and nudged down, then
                  clipped to the surface's own interior: the top edge and the
                  pocket floor keep their highlight while the bottom edge's
                  stroke falls outside the clip and disappears. Two passes
                  approximate the soft falloff of the bar's own
                  `inset 0 3px 4px`, so the cradle and the flat bar light
                  continuously instead of showing a seam. */}
              <g clipPath="url(#bnavCradleInterior)" fill="none">
                <path
                  d={CRADLE_PATH}
                  stroke="rgb(51 140 255 / 0.22)"
                  strokeWidth="4"
                  transform="translate(0 2.5)"
                />
                <path
                  d={CRADLE_PATH}
                  stroke="rgb(51 140 255 / 0.4)"
                  strokeWidth="2"
                  transform="translate(0 1.5)"
                />
              </g>
            </svg>
          </span>

          <NavTab
            item={coursesTab}
            active={isActive(pathname, coursesTab.href)}
            onNavigate={() => setMoreOpen(false)}
          />

          <NotificationTab
            canViewNotifications={canViewNotifications}
            signedIn={signedIn}
            initialUnreadCount={initialUnreadCount}
            onOpen={() => setMoreOpen(false)}
          />

          {/* The FAB is out of flow (position: absolute), so it claims no grid
              cell — it sits here purely so keyboard order runs left to right:
              Courses, Alerts, Home, Dashboard, More. */}
          <Link
            href="/"
            aria-label="Home"
            className="bnav__fab"
            aria-current={pathname === "/" ? "page" : undefined}
            onClick={() => setMoreOpen(false)}
          >
            <span className="bnav__fab-face">
              <span className="bnav__fab-ring" aria-hidden="true" />
              <span className="bnav__fab-core">
                {/* eager, but not `priority`: the bar is always in view on
                    mobile so it must not lazy-flash, while `priority` would
                    inject a preload on every route including the widths where
                    the whole bar is display:none */}
                <Image src="/logo.png" alt="" width={54} height={54} loading="eager" />
              </span>
              <span className="bnav__fab-spark" aria-hidden="true" />
            </span>
          </Link>

          {/* the 92px centre column stays empty: the FAB is positioned off
              .bnav so the notch centre never depends on this cell */}
          <span aria-hidden="true" />

          <NavTab
            item={rightTab}
            active={isActive(pathname, rightTab.href)}
            onNavigate={() => setMoreOpen(false)}
          />

          <button
            type="button"
            ref={moreButtonRef}
            className="bnav__link"
            data-active={
              moreOpen ||
              moreLinks.some((l) => isActive(pathname, l.href)) ||
              moreLegalLinks.some((l) => isActive(pathname, l.href))
            }
            aria-expanded={moreOpen}
            aria-controls="bnav-more-panel"
            onClick={() => (moreOpen ? closeMore() : setMoreOpen(true))}
          >
            <span className="relative">
              <Ellipsis className="bnav__icon" strokeWidth={1.5} aria-hidden="true" />
              <span className="bnav__dot" aria-hidden="true" />
            </span>
            <span className="bnav__label">More</span>
          </button>
        </nav>

        {/* Kept mounted so aria-controls always resolves and the panel can
            animate out; when closed it is visibility:hidden, which also takes
            it out of the tab order and the accessibility tree. */}
        <div
          id="bnav-more-panel"
          data-open={moreOpen}
          aria-labelledby="bnav-more-heading"
          className="bnav__panel absolute inset-x-0 bottom-0 z-[1] max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white pb-[calc(var(--bnav-h)+1.5rem)] shadow-[0_-20px_50px_-12px_rgba(22,51,81,0.28)]"
        >
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <h2 id="bnav-more-heading" className="text-lg font-bold text-navy">
              More
            </h2>
            <button
              type="button"
              onClick={closeMore}
              aria-label="Close menu"
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-navy/60 transition hover:bg-navy/10 hover:text-navy"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 bg-navy/[0.04]">
                <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </span>
            </button>
          </div>

          <div>
            {moreLinks.map((link) => (
              <MoreRow
                key={link.href}
                link={link}
                active={isActive(pathname, link.href)}
                onNavigate={() => setMoreOpen(false)}
              />
            ))}
          </div>

          <p className="px-5 pb-1 pt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            Legal
          </p>
          <div>
            {moreLegalLinks.map((link) => (
              <MoreRow
                key={link.href}
                link={link}
                active={isActive(pathname, link.href)}
                onNavigate={() => setMoreOpen(false)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
