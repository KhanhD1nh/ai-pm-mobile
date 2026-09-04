import type { NotificationItem } from '@/shared/contracts';

export const NOTIFICATION_FILTERS = ['ALL', 'UNREAD', 'ASSIGNED', 'MENTIONS', 'ALERTS', 'AI'] as const;
export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

export function matchesNotificationFilter(filter: NotificationFilter, notification: NotificationItem) {
  if (filter === 'UNREAD') return !notification.read;
  if (filter === 'ASSIGNED') return notification.type.includes('ASSIGNED');
  if (filter === 'MENTIONS') return notification.type.includes('MENTION');
  if (filter === 'ALERTS') {
    return ['OVERDUE', 'DUE_SOON', 'AT_RISK', 'CI_FAILED', 'PROJECT_ALERT'].some((value) => notification.type.includes(value));
  }
  if (filter === 'AI') return notification.type.startsWith('AI_');
  return true;
}
