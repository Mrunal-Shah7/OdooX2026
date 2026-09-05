import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '../../lib/cn';

const items = [
  { label: 'Employees', to: '/employees', prefixes: ['/employees', '/departments', '/contracts', '/schedules', '/holidays', '/users'] },
  { label: 'Attendance', to: '/attendance', prefixes: ['/attendance'] },
  { label: 'Time off', to: '/time-off', prefixes: ['/time-off'] },
  { label: 'Payroll', to: '/payroll', prefixes: ['/payroll'] },
  { label: 'Reports', to: '/reports', prefixes: ['/reports'] },
] as const;

export function NavMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-1 gap-4">
      {items.map((item) => {
        const active = item.prefixes.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`),
        );
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'text-label text-on-primary opacity-85 no-underline hover:opacity-100',
              active && 'font-semibold opacity-100',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
