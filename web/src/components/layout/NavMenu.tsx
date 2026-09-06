import { Link, useRouterState } from '@tanstack/react-router';
import { useSession } from '../../lib/session';
import { can, CAPABILITY } from '../../lib/permissions';

type NavMenuProps = {
  open?: boolean;
  onNavigate?: () => void;
};

export function NavMenu({ open = false, onNavigate }: NavMenuProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const role = user?.role;
  const showManagement = role ? can(role, CAPABILITY.crudEmployeesHr) : false;

  const items = [
    ...(showManagement
      ? [{ label: 'Management', to: '/employees', prefixes: ['/employees', '/departments', '/contracts', '/schedules', '/holidays', '/users'], walkthroughId: 'nav-management' }]
      : []),
    { label: 'Attendance', to: '/attendance', prefixes: ['/attendance'], walkthroughId: 'nav-attendance' },
    { label: 'Time off', to: '/time-off', prefixes: ['/time-off'], walkthroughId: 'nav-time-off' },
    ...(role && can(role, CAPABILITY.readPayrollDashboardReports)
      ? [{ label: 'Payroll', to: '/payroll', prefixes: ['/payroll'], walkthroughId: 'nav-payroll' }]
      : []),
    ...(role && can(role, CAPABILITY.readPayrollDashboardReports)
      ? [{ label: 'Reports', to: '/reports', prefixes: ['/reports'], walkthroughId: 'nav-reports' }]
      : []),
  ];

  return (
    <nav
      id="primary-navigation"
      aria-label="Primary navigation"
      className="top-nav__menu"
      data-open={open || undefined}
    >
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
            data-walkthrough-id={item.walkthroughId}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
