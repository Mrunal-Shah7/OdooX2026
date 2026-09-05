import { NavTabs, type NavTabItem } from './NavTabs';

const tabs: NavTabItem[] = [
  { label: 'Dashboard', to: '/payroll', isExact: true },
  { label: 'Pay runs', to: '/payroll/payruns', walkthroughId: 'payroll-pay-runs' },
  { label: 'Payslips', to: '/payroll/payslips' },
  { label: 'Salary structures', to: '/payroll/structures' },
  { label: 'Salary rules', to: '/payroll/rules' },
];

export function PayrollNavTabs() {
  return <NavTabs tabs={tabs} />;
}
