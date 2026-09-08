import { request } from "@/infrastructure/networking/api-client";
import type { NotificationItem } from "@/shared/contracts";
import type { NotificationFilter } from "../model/notification-filter";

export type NotificationListParams = {
  filter?: NotificationFilter;
  limit?: number;
  offset?: number;
  projectId?: string;
};

export const notificationsApi = {
  list: ({
    filter = "ALL",
    limit = 40,
    offset = 0,
    projectId,
  }: NotificationListParams = {}) => {
    const qs = new URLSearchParams();
    qs.set("filter", filter);
    if (projectId) qs.set("projectId", projectId);
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));
    return request<NotificationItem[]>(`/notifications?${qs}`);
  },
  unreadCount: () => request<{ unread: number }>("/notifications/unread-count"),
  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () =>
    request<{ markedRead: number }>("/notifications/read-all", {
      method: "POST",
      body: "{}",
    }),
};
