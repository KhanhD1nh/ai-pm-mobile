export const workflowKeys = {
  all: ["workflows"] as const,
  statuses: (projectId?: string | null) =>
    [...workflowKeys.all, "statuses", projectId ?? "none"] as const,
};
