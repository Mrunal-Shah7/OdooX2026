import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { UserRole, UserStatus } from '../../../shared/constants';

const SESSION_KEY = 'pp360_user_id';

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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    try {
      if (next) {
        sessionStorage.setItem(SESSION_KEY, next.id);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
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

export function getStoredUserId(): string | null {
  return readStoredUserId();
}
