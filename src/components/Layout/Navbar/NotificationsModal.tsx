"use client";

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
  Megaphone,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import type {
  NotificationCategory,
  NotificationRecord,
  NotificationView,
} from "@/lib/notifications/types";
import {
  fetchNotificationList,
  getCachedNotifications,
  invalidateNotificationCache,
} from "@/lib/notifications/client-cache";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | NotificationCategory;

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ALERT", label: "Alerts" },
  { id: "UPDATE", label: "Updates" },
  { id: "OFFER", label: "Offers" },
];

const PANEL_WIDTH = 400;
const PANEL_MAX_HEIGHT = 520;

type PanelPosition = {
  top: number;
  right: number;
  placement: "below" | "above";
};

type NotificationsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
};

export default function NotificationsModal({
  isOpen,
  onClose,
  onUnreadChange,
  anchorRef,
}: NotificationsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const [view, setView] = useState<NotificationView>("inbox");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const applyList = useCallback(
    (data: { notifications: NotificationRecord[]; unreadCount: number }) => {
      setNotifications(data.notifications);
      onUnreadChange(data.unreadCount);
    },
    [onUnreadChange],
  );

  const loadNotifications = useCallback(async () => {
    const cached = getCachedNotifications(view, category);
    if (cached) {
      applyList(cached);
      setLoading(false);
      if (!cached.fresh) {
        setRefreshing(true);
      }
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchNotificationList(view, category);
      if (data) applyList(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyList, category, view]);

  const updateLayout = useCallback(() => {
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    setIsMobile(mobile);

    if (mobile || !anchorRef.current) {
      setPosition(null);
      return;
    }

    const rect = anchorRef.current.getBoundingClientRect();
    const margin = 12;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;

    const top = placeAbove
      ? Math.max(margin, rect.top - PANEL_MAX_HEIGHT - 8)
      : rect.bottom + 8;

    const right = Math.max(
      margin,
      Math.min(
        window.innerWidth - PANEL_WIDTH - margin,
        window.innerWidth - rect.right,
      ),
    );

    setPosition({
      top,
      right,
      placement: placeAbove ? "above" : "below",
    });
  }, [anchorRef]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, true);

    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [isOpen, updateLayout]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }
    updateLayout();
  }, [isOpen, updateLayout]);

  useEffect(() => {
    if (!isOpen) return;
    void loadNotifications();
  }, [isOpen, loadNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  async function runAction(
    id: string,
    action: "read" | "archive" | "unarchive",
  ) {
    setActingId(id);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id, action }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) return;
      invalidateNotificationCache();
      await loadNotifications();
    } finally {
      setActingId(null);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "markAllRead" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) return;
      invalidateNotificationCache();
      await loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  }

  function handleOpen(notification: NotificationRecord) {
    if (!notification.read) {
      void runAction(notification.id, "read");
    }
    if (notification.link) {
      onClose();
    }
  }

  const emptyTitle =
    view === "archived" ? "No archived notifications" : "You're all caught up";
  const emptyText =
    view === "archived"
      ? "Archived messages will appear here."
      : category === "OFFER"
        ? "Course offers and promotions will appear here."
        : "Important enrollment and session updates will show up here.";

  if (!mounted) return null;

  const panelReady = isMobile || position !== null;

  return createPortal(
    <AnimatePresence>
      {isOpen && panelReady ? (
        <>
          <motion.button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-[190] bg-navy/45 backdrop-blur-[2px] sm:bg-navy/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={
              isMobile
                ? { opacity: 0, y: 24 }
                : { opacity: 0, y: position?.placement === "above" ? 8 : -8, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              isMobile
                ? { opacity: 0, y: 24 }
                : { opacity: 0, y: position?.placement === "above" ? 8 : -8, scale: 0.98 }
            }
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "fixed z-[200] flex flex-col overflow-hidden border border-navy/10 bg-white shadow-2xl",
              isMobile
                ? "inset-x-0 bottom-0 max-h-[min(88vh,640px)] rounded-t-[1.5rem]"
                : "rounded-2xl",
            )}
            style={
              !isMobile && position
                ? {
                    top: position.top,
                    right: position.right,
                    width: `min(${PANEL_WIDTH}px, calc(100vw - 1.5rem))`,
                    maxHeight: `min(${PANEL_MAX_HEIGHT}px, calc(100vh - 1.5rem))`,
                  }
                : undefined
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-navy/8 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-navy sm:text-lg">Notifications</h2>
                  {refreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-navy/35" aria-hidden />
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-navy/50">
                  Alerts, updates, and offers in one place.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-navy/10 text-navy/50 transition hover:bg-navy/5 hover:text-navy"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="shrink-0 space-y-3 px-4 pt-3 sm:px-5">
              <div className="flex flex-wrap gap-2">
                <ViewToggle
                  active={view === "inbox"}
                  onClick={() => setView("inbox")}
                  label="Inbox"
                />
                <ViewToggle
                  active={view === "archived"}
                  onClick={() => setView("archived")}
                  label="Archived"
                />
              </div>

              {view === "inbox" ? (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
                  {CATEGORY_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        category === tab.id
                          ? "bg-btnBg text-white"
                          : "bg-[#f7f9fc] text-navy/60 hover:bg-navy/5",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/40">
                  {view === "archived" ? "Archived" : "Inbox"}
                </p>
                {view === "inbox" && notifications.some((item) => !item.read) ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={markingAll}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-btnBg transition hover:text-btnBg/80 disabled:opacity-60"
                  >
                    {markingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}
                    Mark all read
                  </button>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
              <div className="overflow-hidden rounded-xl border border-navy/8 bg-[#f7f9fc]/60">
                {loading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-navy/45">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : notifications.length > 0 ? (
                  <ul className="divide-y divide-navy/8">
                    {notifications.map((notification) => (
                      <li key={notification.id}>
                        <NotificationRow
                          notification={notification}
                          acting={actingId === notification.id}
                          archivedView={view === "archived"}
                          onArchive={() => runAction(notification.id, "archive")}
                          onUnarchive={() => runAction(notification.id, "unarchive")}
                          onOpen={() => handleOpen(notification)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-10 text-center">
                    <Bell className="mx-auto h-7 w-7 text-navy/15" />
                    <p className="mt-3 text-sm font-semibold text-navy">{emptyTitle}</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-navy/45">
                      {emptyText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function ViewToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-3 py-1.5 text-xs font-semibold transition sm:px-3.5 sm:py-2 sm:text-sm",
        active
          ? "bg-navy text-white"
          : "border border-navy/10 bg-white text-navy/60 hover:bg-navy/5",
      )}
    >
      {label}
    </button>
  );
}

function NotificationRow({
  notification,
  acting,
  archivedView,
  onArchive,
  onUnarchive,
  onOpen,
}: {
  notification: NotificationRecord;
  acting: boolean;
  archivedView: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
  onOpen: () => void;
}) {
  const Icon = categoryIcon(notification.category);

  const body = (
    <>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm sm:h-9 sm:w-9 sm:rounded-xl">
        <Icon className="h-3.5 w-3.5 text-btnBg sm:h-4 sm:w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "text-sm leading-snug text-navy",
              notification.read ? "font-medium" : "font-semibold",
            )}
          >
            {notification.title}
          </p>
          {!notification.read ? (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-btnBg" />
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-navy/55 line-clamp-3 sm:line-clamp-2">
          {notification.content}
        </p>
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-navy/35">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </>
  );

  return (
    <div className="group flex items-start gap-2.5 p-3 transition hover:bg-white sm:gap-3 sm:p-4">
      {notification.link && !archivedView ? (
        <Link
          href={notification.link}
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3"
        >
          {body}
          <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-navy/25" />
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">{body}</div>
      )}

      <button
        type="button"
        disabled={acting}
        onClick={archivedView ? onUnarchive : onArchive}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-navy/10 bg-white text-navy/45 transition hover:border-navy/20 hover:text-navy disabled:opacity-50"
        title={archivedView ? "Restore to inbox" : "Archive"}
        aria-label={archivedView ? "Restore to inbox" : "Archive notification"}
      >
        {acting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : archivedView ? (
          <ArchiveRestore className="h-3.5 w-3.5" />
        ) : (
          <Archive className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function categoryIcon(category: string) {
  if (category === "ALERT") return TriangleAlert;
  if (category === "OFFER") return Megaphone;
  return Sparkles;
}
