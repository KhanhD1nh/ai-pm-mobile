import { request } from '@/infrastructure/networking/api-client';
import type { Issue, IssueComment, IssueParticipant, IssueRelation } from '@/shared/contracts';

export type ScheduledIssue = Pick<Issue, 'id' | 'identifier' | 'title' | 'priority' | 'scheduled_start' | 'scheduled_end' | 'focus_hours'> & {
  status?: string | null;
};

type CalendarResponse = {
  count: number;
  schedule: ScheduledIssue[];
};

export const issuesApi = {
  list: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') qs.set(key, String(value));
    });
    return request<Issue[]>(`/issues?${qs}`);
  },
  calendar: async (projectId: string) => {
    const response = await request<CalendarResponse>(`/issues/calendar?projectId=${encodeURIComponent(projectId)}`);
    return Array.isArray(response.schedule) ? response.schedule : [];
  },
  get: (identifier: string) => request<Issue>(`/issues/${identifier}`),
  create: (data: Record<string, unknown>) => request<Issue>('/issues', { method: 'POST', body: JSON.stringify(data) }),
  update: (identifier: string, data: Record<string, unknown>) => request<Issue>(`/issues/${identifier}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archive: (identifier: string) => request<{ issue: Issue }>(`/issues/${identifier}`, { method: 'DELETE' }),
  comments: (issueId: string) => request<IssueComment[]>(`/issues/${issueId}/comments`),
  addComment: (issueId: string, body: string) => request<IssueComment>(`/issues/${issueId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  updateComment: (issueId: string, commentId: string, body: string) => request<IssueComment>(`/issues/${issueId}/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
  deleteComment: (issueId: string, commentId: string) => request<void>(`/issues/${issueId}/comments/${commentId}`, { method: 'DELETE' }),
  participants: (identifier: string) => request<IssueParticipant[]>(`/issues/${identifier}/participants`),
  addParticipant: (identifier: string, userId: string, role: string) => request<IssueParticipant>(`/issues/${identifier}/participants`, { method: 'POST', body: JSON.stringify({ userId, role }) }),
  updateParticipant: (identifier: string, participantId: string, role: string) => request<IssueParticipant>(`/issues/${identifier}/participants/${participantId}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  removeParticipant: (identifier: string, participantId: string) => request<void>(`/issues/${identifier}/participants/${participantId}`, { method: 'DELETE' }),
  relations: (issueId: string) => request<IssueRelation[]>(`/issue-relations?issueId=${encodeURIComponent(issueId)}`),
  createRelation: (sourceIssueId: string, targetIssueId: string, type: string) => request<IssueRelation>('/issue-relations', { method: 'POST', body: JSON.stringify({ sourceIssueId, targetIssueId, type }) }),
  deleteRelation: (relationId: string) => request<void>(`/issue-relations/${relationId}`, { method: 'DELETE' }),
  schedule: (identifier: string, startsAt: string, durationHours: number) => request(`/issues/${identifier}/schedule`, { method: 'POST', body: JSON.stringify({ startsAt, durationHours }) }),
};
