import { request } from "@/infrastructure/networking/api-client";
import { runQueueableRequest } from "@/infrastructure/persistence/offline-mutation-queue";
import type { Cycle, Milestone } from "@/shared/contracts";

export const planningApi = {
  cycles: (projectId: string) =>
    request<Cycle[]>(`/projects/${projectId}/cycles`),
  createCycle: (projectId: string, data: Record<string, unknown>) =>
    runQueueableRequest<Cycle>({
      endpoint: `/projects/${projectId}/cycles`,
      method: "POST",
      body: data,
      label: "Create cycle",
    }),
  updateCycle: (
    projectId: string,
    cycleId: string,
    data: Record<string, unknown>,
  ) =>
    runQueueableRequest<Cycle>({
      endpoint: `/projects/${projectId}/cycles/${cycleId}`,
      method: "PATCH",
      body: data,
      label: "Update cycle",
    }),
  addIssueToCycle: (projectId: string, cycleId: string, issueId: string) =>
    request(`/projects/${projectId}/cycles/${cycleId}/issues`, {
      method: "POST",
      body: JSON.stringify({ issueId }),
    }),
  removeIssueFromCycle: (projectId: string, cycleId: string, issueId: string) =>
    request<void>(
      `/projects/${projectId}/cycles/${cycleId}/issues/${issueId}`,
      { method: "DELETE" },
    ),
  milestones: (projectId: string) =>
    request<Milestone[]>(
      `/milestones?projectId=${encodeURIComponent(projectId)}`,
    ),
  createMilestone: (data: Record<string, unknown>) =>
    runQueueableRequest<Milestone>({
      endpoint: "/milestones",
      method: "POST",
      body: data,
      label: "Create milestone",
    }),
  updateMilestone: (id: string, data: Record<string, unknown>) =>
    runQueueableRequest<Milestone>({
      endpoint: `/milestones/${id}`,
      method: "PATCH",
      body: data,
      label: "Update milestone",
    }),
  updateMilestoneHealth: (
    id: string,
    expectedVersion: number,
    healthStatus: string,
  ) =>
    request<Milestone>(`/milestones/${id}/health`, {
      method: "PATCH",
      body: JSON.stringify({ expectedVersion, healthStatus }),
    }),
};
