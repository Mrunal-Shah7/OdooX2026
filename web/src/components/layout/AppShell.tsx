import { Outlet } from '@tanstack/react-router';
import { useSession } from '../../lib/session';
import { PageSkeleton } from '../ui/Skeleton';
import { TopNav } from './TopNav';
import { RoleWalkthrough } from './RoleWalkthrough';

export function AppShell() {
  const { user } = useSession();

  if (!user) {
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
