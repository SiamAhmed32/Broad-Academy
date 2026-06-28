"use client";

import type { NotificationListResponse, NotificationView } from "./types";

type CategoryFilter = "all" | string;

const EXAM_ACCESS_NOTIFICATION_TYPES = new Set([
  "EXAM_ENROLLED",
  "EXAM_REJECTED",
]);

function notifyExamAccessChange(data: NotificationListResponse) {
  if (typeof window === "undefined") return;
  if (
    data.notifications.some((notification) =>
      EXAM_ACCESS_NOTIFICATION_TYPES.has(notification.type),
    )
  ) {
    window.dispatchEvent(new CustomEvent("exam-access-changed"));
  }
}

type CacheEntry = NotificationListResponse & { fetchedAt: number };

const FRESH_MS = 45_000;
const STALE_MS = 5 * 60_000;
const POLL_MS = 3 * 60_000;

const listCache = new Map<string, CacheEntry>();
let unreadCount = 0;
let unreadCountFetchedAt = 0;

let listInflight: Promise<NotificationListResponse | null> | null = null;
let listInflightKey: string | null = null;
let countInflight: Promise<number> | null = null;

function listKey(view: NotificationView, category: CategoryFilter) {
  return `${view}:${category}`;
}

export function seedNotificationCache(unread: number) {
  unreadCount = unread;
  unreadCountFetchedAt = Date.now();
}

export function invalidateNotificationCache() {
  listCache.clear();
  unreadCountFetchedAt = 0;
  listInflight = null;
  listInflightKey = null;
  countInflight = null;
}

export function getCachedNotifications(view: NotificationView, category: CategoryFilter) {
  const entry = listCache.get(listKey(view, category));
  if (!entry) return null;

  const age = Date.now() - entry.fetchedAt;
  if (age > STALE_MS) {
    listCache.delete(listKey(view, category));
    return null;
  }

  return {
    notifications: entry.notifications,
    unreadCount: entry.unreadCount,
    fresh: age < FRESH_MS,
  };
}

function storeList(
  view: NotificationView,
  category: CategoryFilter,
  data: NotificationListResponse,
) {
  listCache.set(listKey(view, category), { ...data, fetchedAt: Date.now() });
  unreadCount = data.unreadCount;
  unreadCountFetchedAt = Date.now();
}

export async function fetchNotificationList(
  view: NotificationView,
  category: CategoryFilter,
  { force = false }: { force?: boolean } = {},
): Promise<NotificationListResponse | null> {
  const key = listKey(view, category);
  const cached = getCachedNotifications(view, category);
  if (!force && cached?.fresh) {
    return { notifications: cached.notifications, unreadCount: cached.unreadCount };
  }

  if (listInflight && listInflightKey === key) {
    return listInflight;
  }

  listInflightKey = key;
  listInflight = (async () => {
    try {
      const params = new URLSearchParams({ view, category });
      const response = await fetch(`/api/notifications?${params}`, {
        credentials: "same-origin",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        return cached
          ? { notifications: cached.notifications, unreadCount: cached.unreadCount }
          : null;
      }

      const data = payload.data as NotificationListResponse;
      storeList(view, category, data);
      if (view === "inbox") notifyExamAccessChange(data);
      return data;
    } catch {
      return cached
        ? { notifications: cached.notifications, unreadCount: cached.unreadCount }
        : null;
    } finally {
      listInflight = null;
      listInflightKey = null;
    }
  })();

  return listInflight;
}

export async function fetchUnreadCount(force = false): Promise<number> {
  if (!force && Date.now() - unreadCountFetchedAt < FRESH_MS) {
    return unreadCount;
  }

  const cachedInbox = getCachedNotifications("inbox", "all");
  if (!force && cachedInbox?.fresh) {
    return cachedInbox.unreadCount;
  }

  if (countInflight) {
    return countInflight;
  }

  countInflight = (async () => {
    try {
      const response = await fetch("/api/notifications/count", {
        credentials: "same-origin",
      });
      const payload = await response.json();
      if (response.ok && payload.success) {
        unreadCount = payload.data.unreadCount as number;
        unreadCountFetchedAt = Date.now();
      }
    } catch {
      // Keep the last known count.
    } finally {
      countInflight = null;
    }

    return unreadCount;
  })();

  return countInflight;
}

export function prefetchInboxNotifications() {
  const cached = getCachedNotifications("inbox", "all");
  if (cached?.fresh) return;
  void fetchNotificationList("inbox", "all");
}

export function hasCachedInbox() {
  return getCachedNotifications("inbox", "all") !== null;
}

export { POLL_MS };
