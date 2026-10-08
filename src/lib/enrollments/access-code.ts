import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";

// No 0/O or 1/I so the code is easy to read out and type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateAccessCode() {
  const bytes = randomBytes(8);
  let code = "BA-";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return code;
}

/**
 * Returns the enrollment's unique access code, creating it on first use.
 * Students share it (with their enrollment email) when asking to join the
 * course's private Facebook group, so admins can verify the request.
 */
export async function ensureEnrollmentAccessCode(enrollmentId: string) {
  const existing = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { accessCode: true },
  });
  if (!existing) return null;
  if (existing.accessCode) return existing.accessCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const accessCode = generateAccessCode();
    try {
      const updated = await db.enrollment.updateMany({
        where: { id: enrollmentId, accessCode: null },
        data: { accessCode },
      });
      if (updated.count > 0) return accessCode;
      // Another request set it first.
      const current = await db.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { accessCode: true },
      });
      return current?.accessCode ?? null;
    } catch {
      // Unique collision: try a new code.
    }
  }
  return null;
}
