import { ADMIN_PERMISSIONS, hasAdminPermission } from "@/lib/admin/permissions";
import { getStaffUserFromRequest } from "@/lib/admin/session";
import { errorResponse } from "@/lib/auth/response";
import { studentCanShareFiles } from "@/lib/counselling/files";
import { db } from "@/lib/db";

/** Students may keep at most this many of their own files on one session. */
export const STUDENT_FILE_LIMIT = 20;

type SessionUser = { id: string; email: string; role: string };

export type FileAccess =
  | { ok: true; isStaff: boolean; booking: NonNullable<Awaited<ReturnType<typeof loadBooking>>> }
  | { ok: false; response: Response };

async function loadBooking(id: string) {
  return db.counsellingBooking.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      email: true,
      fullName: true,
      status: true,
      archivedAt: true,
    },
  });
}

function ownsBooking(user: SessionUser, booking: { userId: string | null; email: string }) {
  return booking.userId === user.id || booking.email.toLowerCase() === user.email.toLowerCase();
}

/**
 * Who may view, add or remove files on a counselling session:
 * - staff with counselling access: always (except on archived sessions);
 * - the student/parent who booked: view always; add/remove their own files
 *   only once the session is confirmed.
 */
export async function authorizeCounsellingFiles(
  user: SessionUser,
  bookingId: string,
  action: "view" | "upload" | "delete",
): Promise<FileAccess> {
  const booking = await loadBooking(bookingId);
  if (!booking) return { ok: false, response: errorResponse("Session not found.", 404) };

  if (user.role !== "STUDENT") {
    const staff = await getStaffUserFromRequest();
    if (!staff || !hasAdminPermission(staff, ADMIN_PERMISSIONS.COUNSELLING)) {
      return { ok: false, response: errorResponse("You do not have permission for this action.", 403) };
    }
    if (action !== "view" && booking.archivedAt) {
      return {
        ok: false,
        response: errorResponse("Archived sessions are read-only. Restore the session first.", 409),
      };
    }
    return { ok: true, isStaff: true, booking };
  }

  if (!ownsBooking(user, booking)) {
    return { ok: false, response: errorResponse("You cannot access files for this session.", 403) };
  }
  if (action !== "view" && !studentCanShareFiles(booking)) {
    return {
      ok: false,
      response: errorResponse(
        "You can share documents after our team confirms your session.",
        403,
      ),
    };
  }
  return { ok: true, isStaff: false, booking };
}
