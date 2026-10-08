import { db } from "@/lib/db";
import { createUserNotification } from "@/lib/notifications/service";

const STATUS_TEXT: Record<string, string> = {
  PENDING: "is waiting for review",
  REVIEWED: "has been reviewed",
  APPROVED: "has been approved",
  REJECTED: "needs your attention",
};

/** Tells the student (in-app) that their document has an update or a reply. */
export async function notifyStudentAboutDocument(
  document: {
    userId: string | null;
    email: string;
    documentType: string;
    status: string;
  },
  options: { replied: boolean },
) {
  const userId =
    document.userId ??
    (
      await db.user.findFirst({
        where: { email: { equals: document.email, mode: "insensitive" }, role: "STUDENT" },
        select: { id: true },
      })
    )?.id;
  if (!userId) return;

  await createUserNotification({
    userId,
    title: options.replied ? "New reply on your document" : "Document status updated",
    content: options.replied
      ? `Broad Academy replied to your "${document.documentType}" submission.`
      : `Your "${document.documentType}" submission ${STATUS_TEXT[document.status] ?? "was updated"}.`,
    type: "DOCUMENT_UPDATE",
    category: document.status === "REJECTED" ? "ALERT" : "UPDATE",
    link: "/submit-documents",
  });
}
