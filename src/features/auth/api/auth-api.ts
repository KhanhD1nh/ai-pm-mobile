import { request } from '@/infrastructure/networking/api-client';
import type { AuthResponse, User } from '@/shared/contracts';

export const authApi = {
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name: string, email: string, password: string) => request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  setupStatus: () => request<{ initialSetupRequired: boolean }>('/auth/setup-status'),
  me: () => request<User>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};
