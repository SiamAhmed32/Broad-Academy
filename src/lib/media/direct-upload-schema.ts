import { z } from "zod";

/** Cloudinary upload result the browser sends back after a direct upload. */
export const directUploadResultSchema = z.object({
  publicId: z.string().min(1).max(300),
  version: z.coerce.number().int().positive(),
  signature: z.string().min(10).max(128),
  resourceType: z.string().min(1).max(20),
  format: z.string().max(20).nullable().optional(),
  bytes: z.coerce.number().int().min(0),
  secureUrl: z.string().url().max(600),
});

/** A file the browser is about to upload, sent when asking for a signature. */
export const directUploadRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  size: z.coerce.number().int().min(0),
});
