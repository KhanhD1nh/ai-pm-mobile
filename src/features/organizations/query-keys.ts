export const organizationKeys = {
  all: ['organizations'] as const,
  members: (orgId?: string | null) => [...organizationKeys.all, 'members', orgId ?? 'none'] as const,
  budget: (orgId?: string | null) => [...organizationKeys.all, 'budget', orgId ?? 'none'] as const,
};
