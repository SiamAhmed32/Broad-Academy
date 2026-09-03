"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchUnreadCount,
  POLL_MS,
  prefetchInboxNotifications,
  seedNotificationCache,
} from "@/lib/notifications/client-cache";

/**
 * Shared unread-count + open/close state behind both notification triggers
 * (the navbar bell and the mobile bottom-nav tab), so the polling and cache
 * seeding logic exists in exactly one place.
 */
export function useNotificationBell(enabled: boolean, initialUnreadCount = 0) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const seededRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // `enabled` reset, adjusted during render rather than in an effect (React's
  // recommended pattern for reacting to a changed input, and it must be
  // useState here — a ref cannot be read or written during render).
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) setUnreadCount(0);
  }

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
    if (!enabled) return;

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

  const handleOpen = useCallback(() => {
    prefetchInboxNotifications();
    setOpen((value) => !value);
  }, []);

  return { anchorRef, open, setOpen, unreadCount, setUnreadCount, handleOpen };
}
