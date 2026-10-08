import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { sendContactReply } from "@/lib/contact/email";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const replySchema = z.object({
  reply: z.string().trim().min(2, "Write a reply first.").max(5000),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.CONTACT);
  if (error) return error;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "Please write a reply.",
      422,
      parsed.error.flatten().fieldErrors,
    );
  }

  const existing = await db.contactMessage.findUnique({ where: { id } });
  if (!existing) return errorResponse("Contact message not found.", 404);

  try {
    await sendContactReply({
      email: existing.email,
      fullName: existing.fullName,
      subject: existing.subject,
      originalMessage: existing.message,
      reply: parsed.data.reply,
    });
  } catch (sendError) {
    console.error("Contact reply email failed:", sendError);
    return errorResponse("The email could not be sent. Please try again.", 502);
  }

  const message = await db.contactMessage.update({
    where: { id },
    data: {
      replyMessage: parsed.data.reply,
      repliedAt: new Date(),
      status: existing.status === "NEW" ? "READ" : existing.status,
    },
  });

  return NextResponse.json(
    { success: true, message: "Reply sent.", data: message },
    { headers: { "Cache-Control": "no-store" } },
  );
}
