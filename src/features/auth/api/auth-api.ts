import { request } from '@/infrastructure/networking/api-client';
import type { AuthResponse, User } from '@/shared/contracts';

export interface TelegramLoginConfig {
  enabled: boolean;
  botUsername: string | null;
}

export interface TelegramLoginNonce {
  nonce: string;
  deepLink: string;
  expiresIn: number;
}

export interface TelegramLoginPollResult {
  approved: boolean;
  token?: string;
  user?: User;
}

export const authApi = {
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name: string, email: string, password: string) => request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  setupStatus: () => request<{ initialSetupRequired: boolean }>('/auth/setup-status'),
  me: () => request<User>('/auth/me'),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  telegramConfig: () => request<TelegramLoginConfig>('/auth/telegram/config'),
  telegramLoginNonce: () => request<TelegramLoginNonce>('/auth/telegram/login-nonce'),
  telegramLoginPoll: (nonce: string, signal?: AbortSignal) => request<TelegramLoginPollResult>('/auth/telegram/login-poll', {
      method: 'POST',
      body: JSON.stringify({ nonce }),
      signal,
    }),
};
