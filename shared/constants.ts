export const USER_ROLE = {
  employee: 'employee',
  hr_manager: 'hr_manager',
  hr_payroll_user: 'hr_payroll_user',
  hr_payroll_manager: 'hr_payroll_manager',
  admin: 'admin',
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/** Ascending privilege. Higher index inherits capabilities of lower ones. */
export const ROLE_ORDER = [
  USER_ROLE.employee,
  USER_ROLE.hr_manager,
  USER_ROLE.hr_payroll_user,
  USER_ROLE.hr_payroll_manager,
  USER_ROLE.admin,
] as const;

export const USER_STATUS = {
  invited: 'invited',
  active: 'active',
  disabled: 'disabled',
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const AUTH_TOKEN_PURPOSE = {
  invite: 'invite',
  password_reset: 'password_reset',
} as const;
export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSE)[keyof typeof AUTH_TOKEN_PURPOSE];

export const CURRENCY = {
  INR: 'INR',
  USD: 'USD',
} as const;
export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const EMPLOYEE_TYPE = {
  full_time: 'full_time',
  part_time: 'part_time',
  contract: 'contract',
  intern: 'intern',
} as const;
export type EmployeeType = (typeof EMPLOYEE_TYPE)[keyof typeof EMPLOYEE_TYPE];

export const EMPLOYEE_STATUS = {
  active: 'active',
  inactive: 'inactive',
} as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

export const CONTRACT_STATUS = {
  draft: 'draft',
  running: 'running',
  expired: 'expired',
  cancelled: 'cancelled',
} as const;
export type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

export const ATTENDANCE_STATUS = {
  present: 'present',
  late: 'late',
  absent: 'absent',
  half_day: 'half_day',
  on_leave: 'on_leave',
} as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const TIME_OFF_UNIT = {
  days: 'days',
  hours: 'hours',
} as const;
export type TimeOffUnit = (typeof TIME_OFF_UNIT)[keyof typeof TIME_OFF_UNIT];

export const TIME_OFF_DURATION_TYPE = {
  full_day: 'full_day',
  half_day: 'half_day',
  hours: 'hours',
} as const;
export type TimeOffDurationType =
  (typeof TIME_OFF_DURATION_TYPE)[keyof typeof TIME_OFF_DURATION_TYPE];

export const ALLOCATION_STATUS = {
  draft: 'draft',
  approved: 'approved',
  refused: 'refused',
} as const;
export type AllocationStatus = (typeof ALLOCATION_STATUS)[keyof typeof ALLOCATION_STATUS];

export const REQUEST_STATUS = {
  to_approve: 'to_approve',
  approved: 'approved',
  refused: 'refused',
  cancelled: 'cancelled',
} as const;
export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export const RULE_CATEGORY = {
  basic: 'basic',
  allowance: 'allowance',
  gross: 'gross',
  deduction: 'deduction',
  net: 'net',
} as const;
export type RuleCategory = (typeof RULE_CATEGORY)[keyof typeof RULE_CATEGORY];

export const RULE_COMPUTATION = {
  fixed: 'fixed',
  percentage: 'percentage',
  formula: 'formula',
} as const;
export type RuleComputation = (typeof RULE_COMPUTATION)[keyof typeof RULE_COMPUTATION];

export const PERCENTAGE_BASE = {
  contract_wage: 'contract_wage',
  basic: 'basic',
  gross: 'gross',
} as const;
export type PercentageBase = (typeof PERCENTAGE_BASE)[keyof typeof PERCENTAGE_BASE];

export const PAYRUN_STATUS = {
  draft: 'draft',
  computed: 'computed',
  validated: 'validated',
  paid: 'paid',
} as const;
export type PayrunStatus = (typeof PAYRUN_STATUS)[keyof typeof PAYRUN_STATUS];

export const PAYSLIP_STATUS = {
  draft: 'draft',
  computed: 'computed',
  done: 'done',
  paid: 'paid',
} as const;
export type PayslipStatus = (typeof PAYSLIP_STATUS)[keyof typeof PAYSLIP_STATUS];

export const NOTIFICATION_TYPE = {
  time_off_requested: 'time_off_requested',
  time_off_approved: 'time_off_approved',
  time_off_refused: 'time_off_refused',
  payslip_sent: 'payslip_sent',
  payrun_validated: 'payrun_validated',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const PAYSLIP_WARNING_CODE = {
  MISSING_BANK_ACCOUNT: 'MISSING_BANK_ACCOUNT',
  NO_ACTIVE_CONTRACT: 'NO_ACTIVE_CONTRACT',
  DUPLICATE_PAYSLIP: 'DUPLICATE_PAYSLIP',
  CONTRACT_EXPIRING: 'CONTRACT_EXPIRING',
  ZERO_WORKED_DAYS: 'ZERO_WORKED_DAYS',
  UNRECORDED_ATTENDANCE: 'UNRECORDED_ATTENDANCE',
} as const;
export type PayslipWarningCode =
  (typeof PAYSLIP_WARNING_CODE)[keyof typeof PAYSLIP_WARNING_CODE];

export const ERROR_CODE = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL',
} as const;
export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
