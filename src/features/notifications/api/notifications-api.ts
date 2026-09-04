import { request } from '@/infrastructure/networking/api-client';
import type { NotificationItem } from '@/shared/contracts';

export const notificationsApi = {
  list: (unreadOnly = false, projectId?: string) => {
    const qs = new URLSearchParams();
    if (unreadOnly) qs.set('unreadOnly', 'true');
    if (projectId) qs.set('projectId', projectId);
    qs.set('limit', '100');
    return request<NotificationItem[]>(`/notifications?${qs}`);
  },
  unreadCount: () => request<{ unread: number }>('/notifications/unread-count'),
  markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request<{ markedRead: number }>('/notifications/read-all', { method: 'POST', body: '{}' }),
};
