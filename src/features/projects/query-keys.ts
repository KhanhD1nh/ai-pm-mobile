export const projectKeys = {
  all: ["projects"] as const,
  list: (orgId?: string | null) =>
    [...projectKeys.all, "list", orgId ?? "none"] as const,
  detail: (projectId?: string | null) =>
    [...projectKeys.all, "detail", projectId ?? "none"] as const,
  report: (projectId?: string | null, projectKey?: string | null) =>
    [
      ...projectKeys.all,
      "report",
      projectId ?? "none",
      projectKey ?? "none",
    ] as const,
  tags: (projectId?: string | null) =>
    [...projectKeys.all, "tags", projectId ?? "none"] as const,
};
