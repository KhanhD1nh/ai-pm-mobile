import { request } from '@/lib/api';
import type {
  Agent,
  AiAction,
  AuthResponse,
  Cycle,
  DailyReport,
  Issue,
  IssueComment,
  IssueParticipant,
  IssueRelation,
  Milestone,
  NotificationItem,
  Organization,
  Project,
  ProjectMember,
  User,
  WikiPage,
  WorkflowStatus,
} from '@/types';

export const authApi = {
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name: string, email: string, password: string) => request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  setupStatus: () => request<{ initialSetupRequired: boolean }>('/auth/setup-status'),
  me: () => request<User>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};

export const organizationsApi = {
  list: () => request<Organization[]>('/orgs'),
  create: (slug: string, name: string) => request<Organization>('/orgs', { method: 'POST', body: JSON.stringify({ slug, name }) }),
  update: (orgId: string, name: string) => request<Organization>(`/orgs/${orgId}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  members: (orgId: string) => request<any[]>(`/orgs/${orgId}/members`),
  addMember: (orgId: string, email: string, role: string) => request<any>(`/orgs/${orgId}/members`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  updateMember: (orgId: string, memberId: string, role: string) => request<any>(`/orgs/${orgId}/members/${memberId}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  removeMember: (orgId: string, memberId: string) => request<void>(`/orgs/${orgId}/members/${memberId}`, { method: 'DELETE' }),
  aiBudget: (orgId: string) => request<{ monthlyUsdLimit: number; currentUsageUsd: number; alertThresholdPct: number; resetDay: number }>(`/orgs/${orgId}/ai-budget`),
  updateAiBudget: (orgId: string, data: Record<string, number>) => request(`/orgs/${orgId}/ai-budget`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const projectsApi = {
  list: () => request<Project[]>('/projects'),
  get: (id: string) => request<Project>(`/projects/${id}`),
  create: (key: string, name: string, description?: string) => request<Project>('/projects', { method: 'POST', body: JSON.stringify({ key, name, description }) }),
  update: (id: string, data: Record<string, unknown>) => request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  report: (key: string) => request<DailyReport>(`/projects/${key}/reports/daily`),
  statuses: (projectId: string) => request<WorkflowStatus[]>(`/workflows/${projectId}/statuses`),
  tags: (projectId: string) => request<any[]>(`/projects/${projectId}/tags`),
  createTag: (projectId: string, name: string, color: string) => request(`/projects/${projectId}/tags`, { method: 'POST', body: JSON.stringify({ name, color }) }),
  createStatus: (projectId: string, data: Record<string, unknown>) => request<WorkflowStatus>(`/workflows/${projectId}/statuses`, { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (projectId: string, statusId: string, data: Record<string, unknown>) => request<WorkflowStatus>(`/workflows/${projectId}/statuses/${statusId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStatus: (projectId: string, statusId: string) => request<void>(`/workflows/${projectId}/statuses/${statusId}`, { method: 'DELETE' }),
  cycles: (projectId: string) => request<Cycle[]>(`/projects/${projectId}/cycles`),
  createCycle: (projectId: string, data: Record<string, unknown>) => request<Cycle>(`/projects/${projectId}/cycles`, { method: 'POST', body: JSON.stringify(data) }),
  updateCycle: (projectId: string, cycleId: string, data: Record<string, unknown>) => request<Cycle>(`/projects/${projectId}/cycles/${cycleId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addIssueToCycle: (projectId: string, cycleId: string, issueId: string) => request(`/projects/${projectId}/cycles/${cycleId}/issues`, { method: 'POST', body: JSON.stringify({ issueId }) }),
  removeIssueFromCycle: (projectId: string, cycleId: string, issueId: string) => request<void>(`/projects/${projectId}/cycles/${cycleId}/issues/${issueId}`, { method: 'DELETE' }),
  milestones: (projectId: string) => request<Milestone[]>(`/milestones?projectId=${encodeURIComponent(projectId)}`),
  createMilestone: (data: Record<string, unknown>) => request<Milestone>('/milestones', { method: 'POST', body: JSON.stringify(data) }),
  updateMilestone: (id: string, data: Record<string, unknown>) => request<Milestone>(`/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  members: (projectId: string) => request<ProjectMember[]>(`/projects/${projectId}/members`),
  addMember: (projectId: string, userId: string, role = 'MEMBER') => request<ProjectMember>(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify({ userId, role }) }),
  updateMember: (projectId: string, userId: string, role: string) => request<ProjectMember>(`/projects/${projectId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  removeMember: (projectId: string, userId: string) => request<void>(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
};

export const issuesApi = {
  list: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    return request<Issue[]>(`/issues?${qs}`);
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

export const wikiApi = {
  list: (projectKey: string, q?: string) => request<WikiPage[]>(`/projects/${projectKey}/wiki${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (projectKey: string, slug: string) => request<WikiPage>(`/projects/${projectKey}/wiki/${slug}`),
  save: (projectKey: string, slug: string, title: string, content: string) => request<WikiPage>(`/projects/${projectKey}/wiki`, { method: 'POST', body: JSON.stringify({ slug, title, content, format: 'MARKDOWN' }) }),
};

export const agentsApi = {
  list: () => request<Agent[]>('/agents'),
  create: (data: Record<string, unknown>) => request<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) => request<Agent>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  actions: () => request<{ actions?: AiAction[] } | AiAction[]>('/ai/actions'),
  revert: (id: string) => request(`/ai/actions/${id}/revert`, { method: 'POST' }),
};

export const settingsApi = {
  users: (q?: string) => request<User[]>(`/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  systemUsers: () => request<any[]>('/users/system'),
  createSystemUser: (data: { name: string; email: string; password: string; orgId?: string; role?: string }) => request<User>('/users/system', { method: 'POST', body: JSON.stringify(data) }),
  deleteSystemUser: (userId: string) => request<void>(`/users/system/${userId}`, { method: 'DELETE' }),
  assignUserWorkspace: (userId: string, orgId: string, role: string) => request(`/users/system/${userId}/workspaces`, { method: 'POST', body: JSON.stringify({ orgId, role }) }),
  removeUserWorkspace: (userId: string, orgId: string) => request<void>(`/users/system/${userId}/workspaces/${orgId}`, { method: 'DELETE' }),
  updateMe: (data: Record<string, unknown>) => request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) => request<void>('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),
  notifications: (unreadOnly = false, projectId?: string) => {
    const qs = new URLSearchParams();
    if (unreadOnly) qs.set('unreadOnly', 'true');
    if (projectId) qs.set('projectId', projectId);
    qs.set('limit', '100');
    return request<NotificationItem[]>(`/notifications?${qs}`);
  },
  unreadCount: () => request<{ unread: number }>('/notifications/unread-count'),
  markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request<{ markedRead: number }>('/notifications/read-all', { method: 'POST', body: '{}' }),
  registerDevice: (data: Record<string, unknown>) => request<any>('/notifications/devices', { method: 'POST', body: JSON.stringify(data) }),
  devices: () => request<any[]>('/notifications/devices'),
  disableDevice: (id: string) => request<void>(`/notifications/devices/${id}`, { method: 'DELETE' }),
};
