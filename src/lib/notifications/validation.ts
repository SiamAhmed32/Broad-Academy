import { z } from "zod";

export const notificationListQuerySchema = z.object({
  view: z.enum(["inbox", "archived"]).default("inbox"),
  category: z.enum(["all", "ALERT", "UPDATE", "OFFER"]).default("all"),
});

export const notificationPatchSchema = z.union([
  z.object({ action: z.literal("markAllRead") }),
  z.object({
    action: z.enum(["read", "archive", "unarchive"]),
    id: z.string().min(1),
  }),
]);
