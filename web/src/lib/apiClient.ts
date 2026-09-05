import type { UserRole, UserStatus } from '../../../shared/constants';
import type { AuthUser } from './session';
import { getStoredUserId } from './session';

const baseUrl = import.meta.env.VITE_API_URL ?? '';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
};

type SuccessEnvelope<T> = { data: T; meta?: { page: number; pageSize: number; total: number } };

export class ApiClientError extends Error {
  readonly code: string;
  readonly details: { field: string; message: string }[];

  constructor(code: string, message: string, details: { field: string; message: string }[] = []) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}

export type Department = {
  id: string;
  name: string;
  code: string;
  headcount: number;
  manager: { id: string; firstName: string; lastName: string } | null;
};

export type SessionUser = AuthUser;

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const userId = getStoredUserId();
  if (userId) {
    headers.set('x-user-id', userId);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const err = body as ApiErrorBody | null;
    throw new ApiClientError(
      err?.error?.code ?? 'INTERNAL',
      err?.error?.message ?? 'Request failed',
      err?.error?.details ?? [],
    );
  }

  const envelope = body as SuccessEnvelope<T>;
  return envelope.data;
}

export const apiClient = {
  login(email: string, password: string): Promise<SessionUser> {
    return request<SessionUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout(): Promise<void> {
    return request<void>('/api/auth/logout', { method: 'POST' });
  },

  getCurrentUser(): Promise<SessionUser> {
    return request<SessionUser>('/api/auth/me');
  },

  requestPasswordReset(email: string): Promise<void> {
    return request<void>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  setPassword(token: string, password: string): Promise<void> {
    return request<void>('/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  listDepartments(): Promise<Department[]> {
    return request<Department[]>('/api/departments');
  },

  createDepartment(body: { name: string; code: string; managerId?: string | null }): Promise<Department> {
    return request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateDepartment(
    id: string,
    body: { name?: string; code?: string; managerId?: string | null },
  ): Promise<Department> {
    return request<Department>(`/api/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  deleteDepartment(id: string): Promise<void> {
    return request<void>(`/api/departments/${id}`, { method: 'DELETE' });
  },
};

export type { UserRole, UserStatus };
