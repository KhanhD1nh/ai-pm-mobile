export const agentKeys = {
  all: ["agents"] as const,
  org: (orgId?: string | null) => [...agentKeys.all, orgId ?? "none"] as const,
  list: (orgId?: string | null) => [...agentKeys.org(orgId), "list"] as const,
  actions: (orgId?: string | null) =>
    [...agentKeys.org(orgId), "actions"] as const,
};
