import { Link, useRouterState } from '@tanstack/react-router';
import { useSession } from '../../lib/session';
import { can, CAPABILITY } from '../../lib/permissions';

export function NavMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const role = user?.role;
  const showManagement = role ? can(role, CAPABILITY.crudEmployeesHr) : false;

  const items = [
    ...(showManagement
      ? [{ label: 'Management', to: '/employees', prefixes: ['/employees', '/departments', '/contracts', '/schedules', '/holidays', '/users'] }]
      : []),
    { label: 'Attendance', to: '/attendance', prefixes: ['/attendance'] },
    { label: 'Time off', to: '/time-off', prefixes: ['/time-off'] },
    ...(role && can(role, CAPABILITY.readPayrollDashboardReports)
      ? [{ label: 'Payroll', to: '/payroll', prefixes: ['/payroll'] }]
      : []),
    ...(role && can(role, CAPABILITY.readPayrollDashboardReports)
      ? [{ label: 'Reports', to: '/reports', prefixes: ['/reports'] }]
      : []),
  ];

  return (
    <nav aria-label="Primary navigation" className="top-nav__menu">
      {items.map((item) => {
        const active = item.prefixes.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`),
        );
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className="top-nav__link"
            data-active={active || undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
