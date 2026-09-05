import { NavTabs, type NavTabItem } from './NavTabs';

export function EmployeeNavTabs() {
  const tabs: NavTabItem[] = [
    { label: 'List', to: '/employees' },
    { label: 'Contracts', to: '/contracts' },
    { label: 'Working schedules', to: '/schedules' },
    { label: 'Public holidays', to: '/holidays' },
  ];

  return <NavTabs tabs={tabs} />;
}
