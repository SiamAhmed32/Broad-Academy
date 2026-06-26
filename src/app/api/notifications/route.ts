import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { getNotificationUserId } from "@/lib/notifications/api-auth";
import { db } from "@/lib/db";
import {
  notificationListQuerySchema,
  notificationPatchSchema,
} from "@/lib/notifications/validation";
import { serializeNotification } from "@/lib/notifications/service";

const LIST_LIMIT = 40;

const notificationSelect = {
  id: true,
  title: true,
  content: true,
  type: true,
  category: true,
  read: true,
  archived: true,
  link: true,
  createdAt: true,
} as const;

export async function GET(request: NextRequest) {
  const userId = await getNotificationUserId();
  if (!userId) {
    return errorResponse("Authentication required.", 401);
  }

  const parsed = notificationListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return errorResponse("Invalid query.", 422);
  }

  const { view, category } = parsed.data;
  const archived = view === "archived";

  const where = {
    userId,
    archived,
    ...(category !== "all" ? { category } : {}),
  };

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      select: notificationSelect,
    }),
    db.notification.count({
      where: {
        userId,
        archived: false,
        read: false,
      },
    }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        notifications: notifications.map(serializeNotification),
        unreadCount,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, max-age=0, must-revalidate",
      },
    },
  );
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const userId = await getNotificationUserId();
  if (!userId) {
    return errorResponse("Authentication required.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = notificationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid notification action.", 422);
  }

  if (parsed.data.action === "markAllRead") {
    await db.notification.updateMany({
      where: { userId, archived: false, read: false },
      data: { read: true },
    });
    return NextResponse.json({
      success: true,
      message: "All notifications marked as read.",
    });
  }

  const notification = await db.notification.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true, archived: true },
  });

  if (!notification) {
    return errorResponse("Notification not found.", 404);
  }

  if (parsed.data.action === "read") {
    await db.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });
    return NextResponse.json({ success: true, message: "Notification marked as read." });
  }

  if (parsed.data.action === "archive") {
    await db.notification.update({
      where: { id: notification.id },
      data: { archived: true, read: true },
    });
    return NextResponse.json({ success: true, message: "Notification archived." });
  }

  await db.notification.update({
    where: { id: notification.id },
    data: { archived: false },
  });
  return NextResponse.json({ success: true, message: "Notification restored." });
}
