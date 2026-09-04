import { env } from '@/config/env';
import { sessionStorage } from '@/infrastructure/auth/session-storage';
import { ApiError } from '@/shared/errors/api-error';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const [token, orgId] = await Promise.all([sessionStorage.getToken(), sessionStorage.getOrgId()]);
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers['x-org-id'] = orgId;

  const url = `${env.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type');
  const data: unknown = contentType?.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data
      ? String((data as Record<string, unknown>).message)
      : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  if (typeof data === 'object' && data !== null && 'success' in data && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}
