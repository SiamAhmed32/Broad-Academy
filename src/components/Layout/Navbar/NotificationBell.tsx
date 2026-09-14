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
          "relative flex h-10 w-10 items-center justify-center rounded-full text-navy/65 transition",
          "hover:bg-navy/5 hover:text-navy",
          open && "bg-btnBg/10 text-btnBg",
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E11D48] px-1 text-[10px] font-bold leading-none text-white ring-[2px] ring-white">
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
