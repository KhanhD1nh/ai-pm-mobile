export const wikiKeys = {
  all: ['wiki'] as const,
  list: (projectId?: string | null, projectKey?: string | null) => [...wikiKeys.all, 'list', projectId ?? 'none', projectKey ?? 'none'] as const,
};
