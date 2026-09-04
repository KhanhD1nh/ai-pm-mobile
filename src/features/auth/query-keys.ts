export const authKeys = {
  all: ['auth'] as const,
  setupStatus: () => [...authKeys.all, 'setup-status'] as const,
};
