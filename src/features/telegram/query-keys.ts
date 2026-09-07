export const telegramKeys = {
  all: ['telegram'] as const,
  preferences: () => [...telegramKeys.all, 'preferences'] as const,
  admin: () => [...telegramKeys.all, 'admin'] as const,
  webhook: () => [...telegramKeys.all, 'webhook'] as const,
};
