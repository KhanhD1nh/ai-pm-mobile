export const wikiKeys = {
  all: ['wiki'] as const,
  list: (projectKey?: string | null) => [...wikiKeys.all, 'list', projectKey ?? 'none'] as const,
};
