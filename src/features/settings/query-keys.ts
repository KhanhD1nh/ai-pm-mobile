export const settingsKeys = {
  all: ['settings'] as const,
  users: (query = '') => [...settingsKeys.all, 'users', query] as const,
  systemUsers: () => [...settingsKeys.all, 'system-users'] as const,
};
