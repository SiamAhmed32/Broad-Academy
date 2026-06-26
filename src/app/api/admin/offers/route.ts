import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { sendOfferCampaignEmails } from "@/lib/newsletter/email";
import { createUserNotification } from "@/lib/notifications/service";

const offerSchema = z.object({
  title: z.string().trim().min(3).max(120),
  content: z.string().trim().min(10).max(500),
  link: z.string().trim().max(200).optional().or(z.literal("")),
  audience: z.enum(["all_students", "user"]).default("all_students"),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.NOTICES);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid offer details.", 422, parsed.error.flatten().fieldErrors);
  }

  const link = parsed.data.link?.trim() || "/courses";

  if (parsed.data.audience === "user") {
    if (!parsed.data.userId) {
      return errorResponse("Select a student for a targeted offer.", 422);
    }
    const student = await db.user.findFirst({
      where: { id: parsed.data.userId, role: "STUDENT", status: "ACTIVE" },
      select: { id: true, email: true },
    });
    if (!student) return errorResponse("Student not found.", 404);

    await createUserNotification({
      userId: student.id,
      title: parsed.data.title,
      content: parsed.data.content,
      type: "OFFER",
      category: "OFFER",
      link,
    });

    const subscribers = await db.newsletterSubscriber.findMany({
      where: { email: student.email, status: "ACTIVE" },
      select: { id: true, email: true },
      take: 1,
    });

    if (subscribers.length > 0) {
      void sendOfferCampaignEmails({
        subscribers,
        title: parsed.data.title,
        content: parsed.data.content,
        link,
      }).catch((error) => {
        console.error("Targeted offer email failed:", error);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Offer sent to the selected student.",
      data: { sent: 1 },
    });
  }

  const students = await db.user.findMany({
    where: { role: "STUDENT", status: "ACTIVE" },
    select: { id: true },
  });

  if (students.length === 0) {
    return errorResponse("No active students to notify.", 404);
  }

  await db.notification.createMany({
    data: students.map((student) => ({
      userId: student.id,
      title: parsed.data.title,
      content: parsed.data.content,
      type: "OFFER",
      category: "OFFER",
      link,
    })),
  });

  const subscribers = await db.newsletterSubscriber.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, email: true },
    take: 4000,
  });

  if (subscribers.length > 0) {
    void sendOfferCampaignEmails({
      subscribers,
      title: parsed.data.title,
      content: parsed.data.content,
      link,
    }).catch((error) => {
      console.error("Offer campaign email failed:", error);
    });
  }

  return NextResponse.json({
    success: true,
    message: `Offer sent to ${students.length} students and ${subscribers.length} newsletter subscribers by email.`,
    data: { sent: students.length, emailed: subscribers.length },
  });
}
