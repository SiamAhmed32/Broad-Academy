import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getNotificationUserId } from "@/lib/notifications/api-auth";
import { db } from "@/lib/db";

export async function GET() {
  const userId = await getNotificationUserId();
  if (!userId) {
    return errorResponse("Authentication required.", 401);
  }

  const unreadCount = await db.notification.count({
    where: {
      userId,
      archived: false,
      read: false,
    },
  });

  return NextResponse.json(
    { success: true, data: { unreadCount } },
    {
      headers: {
        "Cache-Control": "private, no-cache, max-age=0, must-revalidate",
      },
    },
  );
}
