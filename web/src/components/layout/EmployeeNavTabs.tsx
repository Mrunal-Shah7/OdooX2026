import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/cn';
import { useSession } from '../../lib/session';

export function EmployeeNavTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';

  const tabs = [
    { label: 'Directory', to: '/employees' },
    { label: 'Contracts', to: '/contracts' },
    { label: 'Working schedules', to: '/schedules' },
    { label: 'Public holidays', to: '/holidays' },
    ...(isAdmin ? [{ label: 'User management', to: '/users' }] : []),
  ];

  return (
    <div className="mb-5 flex gap-5 border-b border-border px-5 text-label">
      {tabs.map((tab) => {
        const active =
          tab.to === '/employees'
            ? pathname === '/employees' || (pathname.startsWith('/employees/') && pathname !== '/employees/new')
            : pathname === tab.to || pathname.startsWith(`${tab.to}/`);

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'border-b-2 pb-2 transition-colors no-underline',
              active
                ? 'border-accent font-semibold text-text'
                : 'border-transparent text-text-muted hover:border-border-strong hover:text-text',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
