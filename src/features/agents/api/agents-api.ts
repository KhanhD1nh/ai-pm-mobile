import { request } from '@/infrastructure/networking/api-client';
import type { Agent, AiAction } from '@/shared/contracts';

export const agentsApi = {
  list: () => request<Agent[]>('/agents'),
  create: (data: Record<string, unknown>) => request<Agent>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) => request<Agent>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  actions: () => request<{ actions?: AiAction[] } | AiAction[]>('/ai/actions'),
  revert: (id: string) => request(`/ai/actions/${id}/revert`, { method: 'POST' }),
};
