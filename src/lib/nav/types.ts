export type NavSession = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: "STUDENT" | "ADMIN";
  hasEnrollment: boolean;
  studentId: string | null;
  unreadCount: number;
};
