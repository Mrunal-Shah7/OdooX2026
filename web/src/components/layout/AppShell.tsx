import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useSession } from '../../lib/session';
import { PageSkeleton } from '../ui/Skeleton';
import { TopNav } from './TopNav';
import { RoleWalkthrough } from './RoleWalkthrough';

export function AppShell() {
  const navigate = useNavigate();
  const { user, setUser, clearSession } = useSession();
  const [isCheckingSession, setIsCheckingSession] = useState(!user);

  useEffect(() => {
    if (user) {
      setIsCheckingSession(false);
      return;
    }
    let cancelled = false;
    setIsCheckingSession(true);
    apiClient
      .getCurrentUser()
      .then((next) => {
        if (!cancelled) setUser(next);
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          void navigate({ to: '/login' });
        }
      })
      .finally(() => {
        if (!cancelled) setIsCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, setUser, clearSession, navigate]);

  if (isCheckingSession || !user) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <TopNav />
      <main>
        <Outlet />
      </main>
      <RoleWalkthrough />
    </div>
  );
}
