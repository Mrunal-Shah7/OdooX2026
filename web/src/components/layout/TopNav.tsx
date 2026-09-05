import { Link, useNavigate } from '@tanstack/react-router';
import { NavMenu } from './NavMenu';
import { AttendanceWidget } from './AttendanceWidget';
import { NotificationBell } from './NotificationBell';
import { useSession } from '../../lib/session';
import { apiClient } from '../../lib/apiClient';
import { Dropdown } from '../ui/Dropdown';
import { Button } from '../ui/Button';

export function TopNav() {
  const navigate = useNavigate();
  const { user, clearSession } = useSession();

  async function signOut() {
    try {
      await apiClient.logout();
    } catch {
      /* ignore — clear local session anyway */
    }
    clearSession();
    await navigate({ to: '/login' });
  }

  return (
    <header className="sticky top-0 z-nav flex h-[var(--nav-height)] items-center gap-5 bg-primary px-5 text-on-primary">
      <Link to="/" className="text-h3 font-semibold tracking-tight text-on-primary no-underline">
        PeoplePay360
      </Link>
      <NavMenu />
      <div className="ml-auto flex items-center gap-3 text-label">
        <AttendanceWidget />
        <NotificationBell />
        {user ? (
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm" className="border-primary-subtle bg-primary-hover text-on-primary">
                {user.email}
              </Button>
            }
            items={[{ label: 'Sign out', onSelect: () => void signOut() }]}
          />
        ) : null}
      </div>
    </header>
  );
}
