import { NavTabs, type NavTabItem } from './NavTabs';
import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';

const employeeTabs: NavTabItem[] = [
  { label: 'Overview', to: '/time-off', isExact: true },
  { label: 'Requests', to: '/time-off/requests', walkthroughId: 'timeoff-requests' },
  { label: 'Allocations', to: '/time-off/allocations' },
];

export function TimeOffNavTabs() {
  const { user } = useSession();
  const tabs = isHrManagerOrAbove(user?.role ?? 'employee')
    ? [...employeeTabs, { label: 'Leave types', to: '/time-off/types', walkthroughId: 'timeoff-leave-types' }]
    : employeeTabs;

  return <NavTabs tabs={tabs} />;
}
