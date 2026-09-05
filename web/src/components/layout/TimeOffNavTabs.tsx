import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/cn';

const tabs = [
  { label: 'Overview', to: '/time-off' },
  { label: 'Requests', to: '/time-off/requests' },
  { label: 'Allocations', to: '/time-off/allocations' },
  { label: 'Leave types', to: '/time-off/types' },
] as const;

export function TimeOffNavTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mb-5 flex gap-5 border-b border-border px-5 text-label">
      {tabs.map((tab) => {
        const active =
          tab.to === '/time-off'
            ? pathname === '/time-off'
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
