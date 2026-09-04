import Constants from 'expo-constants';
import { sessionStorage } from './storage';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
export const API_BASE_URL = extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const [token, orgId] = await Promise.all([sessionStorage.getToken(), sessionStorage.getOrgId()]);
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (orgId) headers['x-org-id'] = orgId;
  const response = await fetch(`${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, { ...options, headers });
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
