export const notificationKeys = {
  all: ['notifications'] as const,
  org: (orgId?: string | null) => [...notificationKeys.all, orgId ?? 'none'] as const,
  lists: (orgId?: string | null) => [...notificationKeys.org(orgId), 'list'] as const,
  list: (orgId?: string | null, unreadOnly = false) => [...notificationKeys.lists(orgId), unreadOnly ? 'unread-only' : 'all'] as const,
  unread: (orgId?: string | null) => [...notificationKeys.org(orgId), 'unread'] as const,
  devices: (orgId?: string | null) => [...notificationKeys.org(orgId), 'devices'] as const,
};
