import { request } from '@/infrastructure/networking/api-client';
import type { DailyReport, Project, Tag } from '@/shared/contracts';

export const projectsApi = {
  list: () => request<Project[]>('/projects'),
  get: (id: string) => request<Project>(`/projects/${id}`),
  create: (key: string, name: string, description?: string) => request<Project>('/projects', { method: 'POST', body: JSON.stringify({ key, name, description }) }),
  update: (id: string, data: Record<string, unknown>) => request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  report: (key: string) => request<DailyReport>(`/projects/${key}/reports/daily`),
  tags: (projectId: string) => request<Tag[]>(`/projects/${projectId}/tags`),
  createTag: (projectId: string, name: string, color: string) => request<Tag>(`/projects/${projectId}/tags`, { method: 'POST', body: JSON.stringify({ name, color }) }),
};
