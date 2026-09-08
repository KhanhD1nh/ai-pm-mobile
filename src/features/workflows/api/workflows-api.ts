import { request } from "@/infrastructure/networking/api-client";
import type { WorkflowStatus } from "@/shared/contracts";

export const workflowsApi = {
  statuses: (projectId: string) =>
    request<WorkflowStatus[]>(`/workflows/${projectId}/statuses`),
  createStatus: (projectId: string, data: Record<string, unknown>) =>
    request<WorkflowStatus>(`/workflows/${projectId}/statuses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (
    projectId: string,
    statusId: string,
    data: Record<string, unknown>,
  ) =>
    request<WorkflowStatus>(`/workflows/${projectId}/statuses/${statusId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteStatus: (projectId: string, statusId: string) =>
    request<void>(`/workflows/${projectId}/statuses/${statusId}`, {
      method: "DELETE",
    }),
};
