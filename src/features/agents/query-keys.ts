export const agentKeys = {
  all: ['agents'] as const,
  list: () => [...agentKeys.all, 'list'] as const,
  actions: () => [...agentKeys.all, 'actions'] as const,
};
