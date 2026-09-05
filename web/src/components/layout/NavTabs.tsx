import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/cn';

export type NavTabItem = {
  label: string;
  to: string;
  isExact?: boolean;
  walkthroughId?: string;
};

type NavTabsProps = {
  tabs: NavTabItem[];
  className?: string;
};

export function NavTabs({ tabs, className }: NavTabsProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Section navigation" className={cn('nav-tabs', className)}>
      {tabs.map((tab) => {
        const isExact = tab.isExact ?? false;
        const active = isExact
          ? pathname === tab.to
          : pathname === tab.to || (pathname.startsWith(`${tab.to}/`) && pathname !== `${tab.to}/new`);

        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className="nav-tabs__link"
            data-active={active || undefined}
            data-walkthrough-id={tab.walkthroughId}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
