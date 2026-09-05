import { useSession } from '../../lib/session';
import { NavTabs, type NavTabItem } from './NavTabs';

export function EmployeeNavTabs() {
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';

  const tabs: NavTabItem[] = [
    { label: 'Directory', to: '/employees' },
    { label: 'Contracts', to: '/contracts' },
    { label: 'Working schedules', to: '/schedules' },
    { label: 'Public holidays', to: '/holidays' },
    ...(isAdmin ? [{ label: 'User management', to: '/users' }] : []),
  ];

  return <NavTabs tabs={tabs} />;
}
