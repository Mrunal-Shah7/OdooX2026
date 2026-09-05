import { ROLE_ORDER, USER_ROLE, type UserRole } from '../../../shared/constants';

/**
 * Capability keys for TRD §8. Higher roles inherit lower minimums via ROLE_ORDER.
 */
export const CAPABILITY = {
  readOwnHr: 'read_own_hr',
  selfService: 'self_service',
  crudEmployeesHr: 'crud_employees_hr',
  crudTimeOffAdmin: 'crud_time_off_admin',
  readSalaryStructures: 'read_salary_structures',
  managePayruns: 'manage_payruns',
  readPayrollDashboardReports: 'read_payroll_dashboard_reports',
  manageSalaryStructuresPaid: 'manage_salary_structures_paid',
  crudPublicHolidays: 'crud_public_holidays',
  crudUsers: 'crud_users',
} as const;

export type Capability = (typeof CAPABILITY)[keyof typeof CAPABILITY];

const CAPABILITY_MINIMUM: Record<Capability, UserRole> = {
  [CAPABILITY.readOwnHr]: USER_ROLE.employee,
  [CAPABILITY.selfService]: USER_ROLE.employee,
  [CAPABILITY.crudEmployeesHr]: USER_ROLE.hr_manager,
  [CAPABILITY.crudTimeOffAdmin]: USER_ROLE.hr_manager,
  [CAPABILITY.readSalaryStructures]: USER_ROLE.hr_payroll_user,
  [CAPABILITY.managePayruns]: USER_ROLE.hr_payroll_user,
  [CAPABILITY.readPayrollDashboardReports]: USER_ROLE.hr_payroll_user,
  [CAPABILITY.manageSalaryStructuresPaid]: USER_ROLE.hr_payroll_manager,
  [CAPABILITY.crudPublicHolidays]: USER_ROLE.hr_payroll_manager,
  [CAPABILITY.crudUsers]: USER_ROLE.admin,
};

export function roleIndex(role: UserRole): number {
  return ROLE_ORDER.indexOf(role);
}

export function hasMinimumRole(userRole: UserRole, minimum: UserRole): boolean {
  return roleIndex(userRole) >= roleIndex(minimum);
}

/** TRD §8: true when `role` meets or exceeds the capability's minimum role. */
export function can(role: UserRole, capability: Capability): boolean {
  return hasMinimumRole(role, CAPABILITY_MINIMUM[capability]);
}

export function isPayrollRole(role: UserRole): boolean {
  return can(role, CAPABILITY.readSalaryStructures);
}

export function isHrManagerOrAbove(role: UserRole): boolean {
  return can(role, CAPABILITY.crudEmployeesHr);
}

export function isAdmin(role: UserRole): boolean {
  return can(role, CAPABILITY.crudUsers);
}
