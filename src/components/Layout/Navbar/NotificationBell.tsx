"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchUnreadCount,
  POLL_MS,
  prefetchInboxNotifications,
  seedNotificationCache,
} from "@/lib/notifications/client-cache";
import NotificationsModal from "./NotificationsModal";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  variant?: "navbar" | "light";
  enabled?: boolean;
  initialUnreadCount?: number;
};

export function NotificationBell({
  variant = "navbar",
  enabled = true,
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const seededRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    if (!enabled || seededRef.current) return;
    seededRef.current = true;
    seedNotificationCache(initialUnreadCount);
    setUnreadCount(initialUnreadCount);
  }, [enabled, initialUnreadCount]);

  const refreshUnreadCount = useCallback(async (force = false) => {
    const count = await fetchUnreadCount(force);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    let intervalId = 0;

    function startPolling() {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          void refreshUnreadCount();
        }
      }, POLL_MS);
    }

    function scheduleDeferredRefresh() {
      const run = () => void refreshUnreadCount();
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(run, { timeout: 4000 });
      } else {
        window.setTimeout(run, 2500);
      }
    }

    if (document.visibilityState === "visible") {
      scheduleDeferredRefresh();
    }

    startPolling();

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, refreshUnreadCount]);

  if (!enabled) return null;

  function handleOpen() {
    prefetchInboxNotifications();
    setOpen((value) => !value);
  }

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={handleOpen}
        onMouseEnter={prefetchInboxNotifications}
        onFocus={prefetchInboxNotifications}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-lg border transition",
          variant === "navbar"
            ? "border-soft text-soft hover:bg-soft/10 hover:text-white"
            : "border-navy/10 bg-white text-navy shadow-sm hover:bg-navy/5",
          open && variant === "light" && "border-btnBg/30 bg-btnBg/5",
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <NotificationsModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onUnreadChange={setUnreadCount}
          anchorRef={anchorRef}
        />
      ) : null}
    </div>
  );
}
