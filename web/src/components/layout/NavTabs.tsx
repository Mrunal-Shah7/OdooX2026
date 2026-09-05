import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/cn';

export type NavTabItem = {
  label: string;
  to: string;
  isExact?: boolean;
};

type NavTabsProps = {
  tabs: NavTabItem[];
  className?: string;
};

export function NavTabs({ tabs, className }: NavTabsProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className={cn('mb-5 flex space-x-6 border-b border-border px-5 text-label', className)}>
      {tabs.map((tab) => {
        const isExact = tab.isExact ?? false;
        const active = isExact
          ? pathname === tab.to
          : pathname === tab.to || (pathname.startsWith(`${tab.to}/`) && pathname !== `${tab.to}/new`);

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'relative border-b-2 py-2.5 transition-all duration-150 no-underline',
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
