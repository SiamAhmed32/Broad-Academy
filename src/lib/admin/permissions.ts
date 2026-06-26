import type { AdminStaffRole } from "@/generated/prisma/client";

export const ADMIN_PERMISSIONS = {
  COURSES: "courses.manage",
  CONTENT: "content.manage",
  STUDENTS: "students.manage",
  ENROLLMENTS: "enrollments.manage",
  INSTRUCTORS: "instructors.manage",
  TESTIMONIALS: "testimonials.manage",
  NOTICES: "notices.manage",
  COUNSELLING: "counselling.view",
  CONTACT: "contact.view",
  DOCUMENTS: "documents.view",
  USERS: "users.manage",
  EXAMS: "exams.manage",
} as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ALL_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSIONS);

export const ROLE_PERMISSIONS: Record<AdminStaffRole, AdminPermission[]> = {
  OWNER: ALL_ADMIN_PERMISSIONS,
  ADMIN: ALL_ADMIN_PERMISSIONS,
  SUB_ADMIN: [
    ADMIN_PERMISSIONS.COURSES,
    ADMIN_PERMISSIONS.CONTENT,
    ADMIN_PERMISSIONS.STUDENTS,
    ADMIN_PERMISSIONS.ENROLLMENTS,
    ADMIN_PERMISSIONS.INSTRUCTORS,
    ADMIN_PERMISSIONS.TESTIMONIALS,
    ADMIN_PERMISSIONS.NOTICES,
    ADMIN_PERMISSIONS.COUNSELLING,
    ADMIN_PERMISSIONS.CONTACT,
    ADMIN_PERMISSIONS.DOCUMENTS,
    ADMIN_PERMISSIONS.EXAMS,
  ],
  MANAGER: [
    ADMIN_PERMISSIONS.COURSES,
    ADMIN_PERMISSIONS.CONTENT,
    ADMIN_PERMISSIONS.STUDENTS,
    ADMIN_PERMISSIONS.ENROLLMENTS,
    ADMIN_PERMISSIONS.INSTRUCTORS,
    ADMIN_PERMISSIONS.TESTIMONIALS,
    ADMIN_PERMISSIONS.NOTICES,
    ADMIN_PERMISSIONS.COUNSELLING,
    ADMIN_PERMISSIONS.CONTACT,
    ADMIN_PERMISSIONS.DOCUMENTS,
    ADMIN_PERMISSIONS.EXAMS,
  ],
  TEACHER: [
    ADMIN_PERMISSIONS.COURSES,
    ADMIN_PERMISSIONS.CONTENT,
    ADMIN_PERMISSIONS.INSTRUCTORS,
    ADMIN_PERMISSIONS.EXAMS,
  ],
};

export const ADMIN_ROLE_LABELS: Record<AdminStaffRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  SUB_ADMIN: "Sub Admin",
  MANAGER: "Manager",
  TEACHER: "Teacher",
};

export const STAFF_ROLE_DESCRIPTIONS: Record<AdminStaffRole, string> = {
  OWNER: "Full authority, including appointing and managing administrators.",
  ADMIN: "Full operational access and staff access management.",
  SUB_ADMIN: "Broad operational access without staff-role management.",
  MANAGER: "Manages courses, students, enrollments, notices, and support.",
  TEACHER: "Manages teaching content, lessons, quizzes, and instructors.",
};

export function canManageStaffRoles(role: AdminStaffRole) {
  return role === "OWNER" || role === "ADMIN";
}

export function assignableRolesFor(role: AdminStaffRole): AdminStaffRole[] {
  return role === "OWNER"
    ? ["ADMIN", "SUB_ADMIN", "MANAGER", "TEACHER"]
    : role === "ADMIN"
      ? ["SUB_ADMIN", "MANAGER", "TEACHER"]
      : [];
}

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN";
  adminRole: AdminStaffRole;
  permissions: string[];
  status: "ACTIVE" | "SUSPENDED";
};

export function resolveAdminRole(adminRole: AdminStaffRole): AdminStaffRole {
  return adminRole;
}

export function getPermissionsForUser(user: {
  adminRole: AdminStaffRole | null;
  permissions: string[];
}): AdminPermission[] {
  const role = user.adminRole;
  const rolePerms = role ? ROLE_PERMISSIONS[role] : [];
  const extras = user.permissions.filter(
    (p): p is AdminPermission =>
      ALL_ADMIN_PERMISSIONS.includes(p as AdminPermission) &&
      (p !== ADMIN_PERMISSIONS.USERS ||
        role === "OWNER" ||
        role === "ADMIN"),
  );
  return [...new Set([...rolePerms, ...extras])];
}

export function hasAdminPermission(
  user: { adminRole: AdminStaffRole | null; permissions: string[] },
  permission: AdminPermission,
) {
  if (
    permission === ADMIN_PERMISSIONS.USERS &&
    user.adminRole !== "OWNER" &&
    user.adminRole !== "ADMIN"
  ) {
    return false;
  }
  return getPermissionsForUser(user).includes(permission);
}

export function hasAnyAdminPermission(
  user: { adminRole: AdminStaffRole | null; permissions: string[] },
  permissions: AdminPermission[],
) {
  const userPerms = getPermissionsForUser(user);
  return permissions.some((p) => userPerms.includes(p));
}
