import { request } from "@/infrastructure/networking/api-client";
import type { ProjectMember } from "@/shared/contracts";

export const membersApi = {
  list: (projectId: string) =>
    request<ProjectMember[]>(`/projects/${projectId}/members`),
  add: (projectId: string, userId: string, role = "MEMBER") =>
    request<ProjectMember>(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    }),
  addBatch: (projectId: string, userIds: string[], role = "MEMBER") =>
    request<{ added: ProjectMember[]; skippedCount: number }>(
      `/projects/${projectId}/members/batch`,
      { method: "POST", body: JSON.stringify({ userIds, role }) },
    ),
  updateRole: (projectId: string, userId: string, role: string) =>
    request<ProjectMember>(`/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  remove: (projectId: string, userId: string) =>
    request<void>(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    }),
};
