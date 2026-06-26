import { getCurrentUser } from "@/lib/auth/session";
import { hasActiveEnrollment } from "@/lib/students/access";

export async function requireEnrolledStudent() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT" || user.status !== "ACTIVE") {
    return null;
  }

  const enrolled = await hasActiveEnrollment(user.id);
  if (!enrolled) return null;

  return user;
}
