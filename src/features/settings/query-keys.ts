export const settingsKeys = {
  all: ["settings"] as const,
  users: (scope?: string | null, query = "") =>
    [...settingsKeys.all, "users", scope ?? "none", query] as const,
  systemUsers: () => [...settingsKeys.all, "system-users"] as const,
};
