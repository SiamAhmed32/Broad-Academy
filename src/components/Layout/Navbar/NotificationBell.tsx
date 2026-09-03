"use client";

import { Bell } from "lucide-react";

import { prefetchInboxNotifications } from "@/lib/notifications/client-cache";
import NotificationsModal from "./NotificationsModal";
import { useNotificationBell } from "./useNotificationBell";
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
  const { anchorRef, open, setOpen, unreadCount, setUnreadCount, handleOpen } =
    useNotificationBell(enabled, initialUnreadCount);

  if (!enabled) return null;

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
            ? "border-navy/12 bg-white text-navy shadow-sm hover:border-navy/25 hover:bg-navy/5"
            : "border-navy/10 bg-white text-navy shadow-sm hover:bg-navy/5",
          open && "border-btnBg/40 bg-btnBg/5 text-btnBg",
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
