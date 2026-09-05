import { Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { getStoredUserId, useSession } from '../../lib/session';
import { TopNav } from './TopNav';

export function AppShell() {
  const { user, setUser, clearSession } = useSession();

  useEffect(() => {
    if (user) return;
    const id = getStoredUserId();
    if (!id) return;
    let cancelled = false;
    apiClient
      .getCurrentUser()
      .then((next) => {
        if (!cancelled) setUser(next);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [user, setUser, clearSession]);

  return (
    <div className="min-h-screen bg-canvas">
      <TopNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
