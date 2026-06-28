export type NavSession = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: "STUDENT" | "ADMIN";
  hasEnrollment: boolean;
  /** Whether the navbar notification bell should render and poll the inbox API. */
  canViewNotifications: boolean;
  studentId: string | null;
  unreadCount: number;
};
