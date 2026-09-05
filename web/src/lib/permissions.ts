import { ROLE_ORDER, type UserRole } from '../../../shared/constants';

export function roleIndex(role: UserRole): number {
  return ROLE_ORDER.indexOf(role);
}

export function hasMinimumRole(userRole: UserRole, minimum: UserRole): boolean {
  return roleIndex(userRole) >= roleIndex(minimum);
}

export function isPayrollRole(role: UserRole): boolean {
  return hasMinimumRole(role, 'hr_payroll_user');
}

export function isHrManagerOrAbove(role: UserRole): boolean {
  return hasMinimumRole(role, 'hr_manager');
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}
