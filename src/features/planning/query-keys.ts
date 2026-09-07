export const planningKeys = {
  all: ['planning'] as const,
  cycles: (projectId?: string | null) => [...planningKeys.all, 'cycles', projectId ?? 'none'] as const,
  milestones: (projectId?: string | null) => [...planningKeys.all, 'milestones', projectId ?? 'none'] as const,
  schedule: (projectId?: string | null) => [...planningKeys.all, 'schedule', projectId ?? 'none'] as const,
};
