import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  USER_ROLE,
  USER_STATUS,
  type UserRole,
  type UserStatus,
} from '../../../shared/constants';

const SESSION_KEY = 'pp360_user_id';
const SESSION_USER_KEY = 'pp360_session_user';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employee: { id: string; firstName: string; lastName: string } | null;
};

type SessionContextValue = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function readStoredUserId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function storedRole(value: unknown): UserRole | null {
  switch (value) {
    case USER_ROLE.employee:
    case USER_ROLE.hr_manager:
    case USER_ROLE.hr_payroll_user:
    case USER_ROLE.hr_payroll_manager:
    case USER_ROLE.admin:
      return value;
    default:
      return null;
  }
}

function storedStatus(value: unknown): UserStatus | null {
  switch (value) {
    case USER_STATUS.invited:
    case USER_STATUS.active:
    case USER_STATUS.disabled:
      return value;
    default:
      return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const serialized = sessionStorage.getItem(SESSION_USER_KEY);
    if (!serialized) return null;
    const parsed: unknown = JSON.parse(serialized);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('id' in parsed) ||
      typeof parsed.id !== 'string' ||
      !('email' in parsed) ||
      typeof parsed.email !== 'string' ||
      !('role' in parsed) ||
      !('status' in parsed) ||
      !('employee' in parsed)
    ) {
      return null;
    }

    const role = storedRole(parsed.role);
    const status = storedStatus(parsed.status);
    if (!role || !status) return null;

    if (parsed.employee === null) {
      return { id: parsed.id, email: parsed.email, role, status, employee: null };
    }
    if (
      typeof parsed.employee !== 'object' ||
      !('id' in parsed.employee) ||
      typeof parsed.employee.id !== 'string' ||
      !('firstName' in parsed.employee) ||
      typeof parsed.employee.firstName !== 'string' ||
      !('lastName' in parsed.employee) ||
      typeof parsed.employee.lastName !== 'string'
    ) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      role,
      status,
      employee: {
        id: parsed.employee.id,
        firstName: parsed.employee.firstName,
        lastName: parsed.employee.lastName,
      },
    };
  } catch {
    return null;
  }
}

export function getStoredUserId(): string | null {
  return readStoredUserId();
}

export function getStoredAuthToken(): string | null {
  try {
    return sessionStorage.getItem('pp360_auth_token') || null;
  } catch {
    return null;
  }
}

export function clearStoredUserId(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
  } catch {
    /* ignore */
  }
}

/** Role home paths from TRD §9. */
export function homePathForRole(role: UserRole): '/employees' | '/payroll' | '/time-off' {
  if (role === 'admin' || role === 'hr_manager') return '/employees';
  if (role === 'hr_payroll_user' || role === 'hr_payroll_manager') return '/payroll';
  return '/time-off';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => getStoredUser());

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    try {
      if (next) {
        sessionStorage.setItem(SESSION_KEY, next.id);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(next));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_USER_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const value = useMemo(
    () => ({ user, setUser, clearSession }),
    [user, setUser, clearSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
