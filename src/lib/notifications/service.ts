import { db } from "@/lib/db";

import type { NotificationCategory } from "./types";

const MAX_TITLE = 120;
const MAX_CONTENT = 500;
const INTERNAL_LINK = /^\/[a-zA-Z0-9/_?=&%-]*$/;

function sanitizeText(value: string, max: number) {
  return value.trim().slice(0, max);
}

function sanitizeLink(link?: string | null) {
  if (!link) return null;
  const trimmed = link.trim();
  if (!INTERNAL_LINK.test(trimmed)) return null;
  return trimmed;
}

type CreateNotificationInput = {
  userId: string;
  title: string;
  content: string;
  type: string;
  category: NotificationCategory;
  link?: string | null;
};

export async function createUserNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      title: sanitizeText(input.title, MAX_TITLE),
      content: sanitizeText(input.content, MAX_CONTENT),
      type: input.type.slice(0, 64),
      category: input.category,
      link: sanitizeLink(input.link),
    },
  });
}

export async function notifyActiveAdmins(
  input: Omit<CreateNotificationInput, "userId">,
) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: sanitizeText(input.title, MAX_TITLE),
      content: sanitizeText(input.content, MAX_CONTENT),
      type: input.type.slice(0, 64),
      category: input.category,
      link: sanitizeLink(input.link),
    })),
  });
}

export function serializeNotification(notification: {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  read: boolean;
  archived: boolean;
  link: string | null;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    title: notification.title,
    content: notification.content,
    type: notification.type,
    category: notification.category,
    read: notification.read,
    archived: notification.archived,
    link: notification.link,
    createdAt: notification.createdAt.toISOString(),
  };
}
