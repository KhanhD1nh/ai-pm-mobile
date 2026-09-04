export const memberKeys = {
  all: ['project-members'] as const,
  project: (projectId?: string | null) => [...memberKeys.all, projectId ?? 'none'] as const,
};
