import { request } from '@/infrastructure/networking/api-client';
import type { Cycle, Milestone } from '@/shared/contracts';

export const planningApi = {
  cycles: (projectId: string) => request<Cycle[]>(`/projects/${projectId}/cycles`),
  createCycle: (projectId: string, data: Record<string, unknown>) => request<Cycle>(`/projects/${projectId}/cycles`, { method: 'POST', body: JSON.stringify(data) }),
  updateCycle: (projectId: string, cycleId: string, data: Record<string, unknown>) => request<Cycle>(`/projects/${projectId}/cycles/${cycleId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addIssueToCycle: (projectId: string, cycleId: string, issueId: string) => request(`/projects/${projectId}/cycles/${cycleId}/issues`, { method: 'POST', body: JSON.stringify({ issueId }) }),
  removeIssueFromCycle: (projectId: string, cycleId: string, issueId: string) => request<void>(`/projects/${projectId}/cycles/${cycleId}/issues/${issueId}`, { method: 'DELETE' }),
  milestones: (projectId: string) => request<Milestone[]>(`/milestones?projectId=${encodeURIComponent(projectId)}`),
  createMilestone: (data: Record<string, unknown>) => request<Milestone>('/milestones', { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (id: string, data: Record<string, unknown>) => request<Milestone>(`/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
