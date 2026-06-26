export const NOTIFICATION_CATEGORIES = ["ALERT", "UPDATE", "OFFER"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationRecord = {
  id: string;
  title: string;
  content: string;
  type: string;
  category: NotificationCategory;
  read: boolean;
  archived: boolean;
  link: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: NotificationRecord[];
  unreadCount: number;
};

export type NotificationView = "inbox" | "archived";
