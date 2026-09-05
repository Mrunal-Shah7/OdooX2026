import { getStoredAuthToken, getStoredUserId } from './session';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const userId = getStoredUserId();
  if (userId) {
    headers.set('x-user-id', userId);
  }

  const url = path.startsWith('/api') ? path : `/api${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error?.message || 'Request failed';
    throw new Error(message);
  }

  return body as T;
}
