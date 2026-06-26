"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { NavSession } from "@/lib/nav/types";
import { NotificationBell } from "./NotificationBell";

type NavNotificationBellProps = {
  navSession: NavSession;
  placement: "desktop" | "mobile";
};

export function NavNotificationBell({
  navSession,
  placement,
}: NavNotificationBellProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)", placement === "desktop");

  if (!navSession.hasEnrollment) return null;
  if (placement === "desktop" && !isDesktop) return null;
  if (placement === "mobile" && isDesktop) return null;

  return (
    <NotificationBell
      variant="navbar"
      initialUnreadCount={navSession.unreadCount}
    />
  );
}
