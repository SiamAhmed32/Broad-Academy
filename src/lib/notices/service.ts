import { db } from "@/lib/db";

const BATCH_SIZE = 5000;

/** Sends an in-app notification about a notice to every active student. */
export async function notifyStudentsAboutNotice(notice: {
  title: string;
  body: string;
}) {
  const content =
    notice.body.length > 180 ? `${notice.body.slice(0, 177).trimEnd()}...` : notice.body;

  let cursor: string | undefined;
  for (;;) {
    const students = await db.user.findMany({
      where: { role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (students.length === 0) return;

    await db.notification.createMany({
      data: students.map((student) => ({
        userId: student.id,
        title: notice.title.slice(0, 120),
        content: content.slice(0, 500),
        type: "ACADEMY_NOTICE",
        category: "UPDATE",
        link: "/notices",
      })),
    });

    if (students.length < BATCH_SIZE) return;
    cursor = students[students.length - 1].id;
  }
}

export function serializeNotice(notice: {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  pinned: boolean;
  published: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...notice,
    publishedAt: notice.publishedAt.toISOString(),
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
  };
}

export type SerializedNotice = ReturnType<typeof serializeNotice>;
