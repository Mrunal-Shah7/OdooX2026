import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/cn';

const tabs = [
  { label: 'Dashboard', to: '/payroll' },
  { label: 'Pay runs', to: '/payroll/payruns' },
  { label: 'Payslips', to: '/payroll/payslips' },
  { label: 'Salary structures', to: '/payroll/structures' },
  { label: 'Salary rules', to: '/payroll/rules' },
] as const;

export function PayrollNavTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="border-b border-border bg-surface px-5">
      <nav className="flex space-x-6">
        {tabs.map((tab) => {
          const isExact = pathname === tab.to;
          const isSub = tab.to !== '/payroll' && pathname.startsWith(tab.to);
          const active = isExact || isSub;

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'inline-flex items-center border-b-2 py-3 text-label font-medium transition-colors no-underline',
                active
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-text-muted hover:border-border-strong hover:text-text',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
