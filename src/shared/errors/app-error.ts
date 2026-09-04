import { ApiError } from './api-error';

export type AppErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VERSION_CONFLICT'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export type AppError = {
  code: AppErrorCode;
  message: string;
  status?: number;
  details?: unknown;
};

export function normalizeError(error: unknown): AppError {
  if (error instanceof ApiError) {
    if (error.status === 401) return { code: 'AUTH_EXPIRED', message: error.message, status: error.status, details: error.details };
    if (error.status === 403) return { code: 'FORBIDDEN', message: error.message, status: error.status, details: error.details };
    if (error.status === 404) return { code: 'NOT_FOUND', message: error.message, status: error.status, details: error.details };
    if (error.status === 409) return { code: 'VERSION_CONFLICT', message: error.message, status: error.status, details: error.details };
    if (error.status >= 400 && error.status < 500) return { code: 'VALIDATION_ERROR', message: error.message, status: error.status, details: error.details };
    return { code: 'SERVER_ERROR', message: error.message, status: error.status, details: error.details };
  }
  if (error instanceof TypeError) return { code: 'NETWORK_ERROR', message: 'Không thể kết nối tới máy chủ.' };
  if (error instanceof Error) return { code: 'UNKNOWN_ERROR', message: error.message };
  return { code: 'UNKNOWN_ERROR', message: 'Có lỗi xảy ra.' };
}
