import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  Star,
  Shield,
  Users,
  Megaphone,
  Mail,
  type LucideIcon,
} from "lucide-react";

import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/admin/permissions";

export type AdminNavItem = {
  label: string;
  description: string;
  href: string;
  permission: AdminPermission;
  /** Show this item when the user has any of these permissions (defaults to [permission]). */
  anyOfPermissions?: AdminPermission[];
  icon: LucideIcon;
  group: "content" | "people" | "support" | "system";
};

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Announcements",
    description: "Top bar banner campaigns",
    href: "/admin/announcements",
    permission: ADMIN_PERMISSIONS.NOTICES,
    icon: Megaphone,
    group: "content",
  },

  {
    label: "Courses",
    description: "Create and manage courses",
    href: "/admin/courses",
    permission: ADMIN_PERMISSIONS.COURSES,
    icon: BookOpen,
    group: "content",
  },
  {
    label: "Course Content",
    description: "Modules, lessons & syllabus",
    href: "/admin/content",
    permission: ADMIN_PERMISSIONS.CONTENT,
    icon: Layers,
    group: "content",
  },
  {
    label: "Quizzes & Exams",
    description: "Build assessments",
    href: "/admin/quizzes",
    permission: ADMIN_PERMISSIONS.CONTENT,
    icon: ClipboardList,
    group: "content",
  },
  {
    label: "Standalone Exams",
    description: "Create & manage public exams",
    href: "/admin/exams",
    permission: ADMIN_PERMISSIONS.EXAMS,
    icon: ClipboardCheck,
    group: "content",
  },
  {
    label: "Exam Access Requests",
    description: "Approve bKash payment proofs",
    href: "/admin/exams/requests",
    permission: ADMIN_PERMISSIONS.EXAMS,
    icon: ClipboardCheck,
    group: "people",
  },
  {
    label: "Instructors",
    description: "Manage mentor profiles",
    href: "/admin/instructors",
    permission: ADMIN_PERMISSIONS.INSTRUCTORS,
    icon: GraduationCap,
    group: "content",
  },
  {
    label: "Testimonials",
    description: "Student and guardian reviews",
    href: "/admin/testimonials",
    permission: ADMIN_PERMISSIONS.TESTIMONIALS,
    icon: Star,
    group: "content",
  },

  {
    label: "Offers & Popups",
    description: "Sales campaigns and offers",
    href: "/admin/offers",
    permission: ADMIN_PERMISSIONS.NOTICES,
    icon: Megaphone,
    group: "content",
  },
  {
    label: "Newsletter",
    description: "Subscriber list & status",
    href: "/admin/newsletter",
    permission: ADMIN_PERMISSIONS.CONTACT,
    icon: Mail,
    group: "support",
  },
  {
    label: "People & Access",
    description: "Users, requests & enrollments",
    href: "/admin/students",
    permission: ADMIN_PERMISSIONS.STUDENTS,
    anyOfPermissions: [
      ADMIN_PERMISSIONS.STUDENTS,
      ADMIN_PERMISSIONS.ENROLLMENTS,
    ],
    icon: Users,
    group: "people",
  },
  {
    label: "Counselling",
    description: "Session bookings",
    href: "/admin/counselling",
    permission: ADMIN_PERMISSIONS.COUNSELLING,
    icon: MessageSquare,
    group: "support",
  },
  {
    label: "Contact Messages",
    description: "Inbox from contact form",
    href: "/admin/contact",
    permission: ADMIN_PERMISSIONS.CONTACT,
    icon: MessageSquare,
    group: "support",
  },
  {
    label: "Documents",
    description: "Submitted files review",
    href: "/admin/documents",
    permission: ADMIN_PERMISSIONS.DOCUMENTS,
    icon: FileText,
    group: "support",
  },
  {
    label: "Team & Roles",
    description: "Staff access control",
    href: "/admin/team",
    permission: ADMIN_PERMISSIONS.USERS,
    icon: Shield,
    group: "system",
  },
];

export const adminNavGroups = [
  { id: "content", label: "Content" },
  { id: "people", label: "People" },
  { id: "support", label: "Support" },
  { id: "system", label: "System" },
] as const;
