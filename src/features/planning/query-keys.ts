export const planningKeys = {
  all: ["planning"] as const,
  cycles: (projectId?: string | null) =>
    [...planningKeys.all, "cycles", projectId ?? "none"] as const,
  cycleIssues: (projectId?: string | null, cycleId?: string | null) =>
    [
      ...planningKeys.all,
      "cycle-issues",
      projectId ?? "none",
      cycleId ?? "none",
    ] as const,
  backlogIssues: (projectId?: string | null) =>
    [...planningKeys.all, "backlog-issues", projectId ?? "none"] as const,
  milestones: (projectId?: string | null) =>
    [...planningKeys.all, "milestones", projectId ?? "none"] as const,
  schedule: (projectId?: string | null) =>
    [...planningKeys.all, "schedule", projectId ?? "none"] as const,
};
