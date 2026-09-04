export const issueKeys = {
  all: ['issues'] as const,
  project: (projectId?: string | null) => [...issueKeys.all, 'project', projectId ?? 'none'] as const,
  detail: (identifier?: string | null) => [...issueKeys.all, 'detail', identifier ?? 'none'] as const,
  comments: (issueId?: string | null) => [...issueKeys.all, 'comments', issueId ?? 'none'] as const,
  participants: (identifier?: string | null) => [...issueKeys.all, 'participants', identifier ?? 'none'] as const,
  relations: (issueId?: string | null) => [...issueKeys.all, 'relations', issueId ?? 'none'] as const,
  myWork: (orgId?: string | null, userId?: string | null) => [...issueKeys.all, 'my-work', orgId ?? 'none', userId ?? 'none'] as const,
  search: (orgId?: string | null, query = '') => [...issueKeys.all, 'search', orgId ?? 'none', query] as const,
};
