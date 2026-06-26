import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const user = await getCurrentUser();
  const allowedAudience = user?.role === "STUDENT"
    ? (["ALL", "STUDENTS"] as const)
    : user
      ? (["ALL"] as const)
      : (["ALL", "GUESTS"] as const);

  const campaign = await db.popupCampaign.findFirst({
    where: {
      status: "PUBLISHED",
      audience: { in: [...allowedAudience] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      content: true,
      badge: true,
      imageUrl: true,
      ctaText: true,
      ctaLink: true,
      frequency: true,
      endsAt: true,
      updatedAt: true,
      originalPrice: true,
      salePrice: true,
      countdownEndsAt: true,
      theme: true,
    },
  });

  return NextResponse.json(
    { success: true, data: { campaign } },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
