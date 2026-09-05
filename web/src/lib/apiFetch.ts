/** One shared in-flight refresh so parallel 401s don't rotate the same token twice. */
let refreshInflight: Promise<boolean> | null = null;

export function refreshSessionOnce(): Promise<boolean> {
  if (!refreshInflight) {
    refreshInflight = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshInflight = null;
      });
  }
  return refreshInflight;
}

function normalizeApiPath(path: string): string {
  return path.startsWith('/api') ? path : `/api${path}`;
}

/** Anonymous auth routes — a 401 here is not "expired access token". */
export function shouldRefreshOn401(path: string): boolean {
  const p = normalizeApiPath(path);
  return (
    p !== '/api/auth/login' &&
    p !== '/api/auth/refresh' &&
    p !== '/api/auth/forgot-password' &&
    p !== '/api/auth/set-password'
  );
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = normalizeApiPath(path);
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !retried && shouldRefreshOn401(url)) {
    const refreshed = await refreshSessionOnce();
    if (refreshed) {
      return apiFetch<T>(path, init, true);
    }
  }

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
