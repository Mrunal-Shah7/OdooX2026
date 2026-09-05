import { NavTabs, type NavTabItem } from './NavTabs';

const tabs: NavTabItem[] = [
  { label: 'Overview', to: '/time-off', isExact: true },
  { label: 'Requests', to: '/time-off/requests' },
  { label: 'Allocations', to: '/time-off/allocations' },
  { label: 'Leave types', to: '/time-off/types' },
];

export function TimeOffNavTabs() {
  return <NavTabs tabs={tabs} />;
}
