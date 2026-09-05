import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/cn';
import { useSession } from '../../lib/session';
import { isHrManagerOrAbove, isPayrollRole } from '../../lib/permissions';

export function NavMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const role = user?.role;

  const items = [
    { label: 'Employees', to: '/employees', prefixes: ['/employees', '/departments', '/contracts', '/schedules', '/holidays', '/users'] },
    { label: 'Attendance', to: '/attendance', prefixes: ['/attendance'] },
    { label: 'Time off', to: '/time-off', prefixes: ['/time-off'] },
    ...(role && isPayrollRole(role)
      ? [{ label: 'Payroll', to: '/payroll', prefixes: ['/payroll'] }]
      : []),
    ...(role && (isHrManagerOrAbove(role) || isPayrollRole(role))
      ? [{ label: 'Reports', to: '/reports', prefixes: ['/reports'] }]
      : []),
  ];

  return (
    <nav className="flex flex-1 items-center gap-1.5">
      {items.map((item) => {
        const active = item.prefixes.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`),
        );
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-md px-3 py-1.5 text-label font-medium transition-all duration-150 no-underline',
              active
                ? 'bg-primary-hover font-semibold text-on-primary shadow-sm'
                : 'text-on-primary/80 hover:bg-primary-hover/60 hover:text-on-primary',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
