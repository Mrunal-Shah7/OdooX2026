export const USER_ROLE = {
    employee: 'employee',
    hr_manager: 'hr_manager',
    hr_payroll_user: 'hr_payroll_user',
    hr_payroll_manager: 'hr_payroll_manager',
    admin: 'admin',
};
/** Ascending privilege. Higher index inherits capabilities of lower ones. */
export const ROLE_ORDER = [
    USER_ROLE.employee,
    USER_ROLE.hr_manager,
    USER_ROLE.hr_payroll_user,
    USER_ROLE.hr_payroll_manager,
    USER_ROLE.admin,
];
export const USER_STATUS = {
    invited: 'invited',
    active: 'active',
    disabled: 'disabled',
};
export const AUTH_TOKEN_PURPOSE = {
    invite: 'invite',
    password_reset: 'password_reset',
};
export const CURRENCY = {
    INR: 'INR',
    USD: 'USD',
};
export const EMPLOYEE_TYPE = {
    full_time: 'full_time',
    part_time: 'part_time',
    contract: 'contract',
    intern: 'intern',
};
export const EMPLOYEE_STATUS = {
    active: 'active',
    inactive: 'inactive',
};
export const CONTRACT_STATUS = {
    draft: 'draft',
    running: 'running',
    expired: 'expired',
    cancelled: 'cancelled',
};
export const ATTENDANCE_STATUS = {
    present: 'present',
    late: 'late',
    absent: 'absent',
    half_day: 'half_day',
    on_leave: 'on_leave',
};
export const TIME_OFF_UNIT = {
    days: 'days',
    hours: 'hours',
};
export const TIME_OFF_DURATION_TYPE = {
    full_day: 'full_day',
    half_day: 'half_day',
    hours: 'hours',
};
export const ALLOCATION_STATUS = {
    draft: 'draft',
    approved: 'approved',
    refused: 'refused',
};
export const REQUEST_STATUS = {
    to_approve: 'to_approve',
    approved: 'approved',
    refused: 'refused',
    cancelled: 'cancelled',
};
export const RULE_CATEGORY = {
    basic: 'basic',
    allowance: 'allowance',
    gross: 'gross',
    deduction: 'deduction',
    net: 'net',
};
export const RULE_COMPUTATION = {
    fixed: 'fixed',
    percentage: 'percentage',
    formula: 'formula',
};
export const PERCENTAGE_BASE = {
    contract_wage: 'contract_wage',
    basic: 'basic',
    gross: 'gross',
};
export const PAYRUN_STATUS = {
    draft: 'draft',
    computed: 'computed',
    validated: 'validated',
    paid: 'paid',
};
export const PAYSLIP_STATUS = {
    draft: 'draft',
    computed: 'computed',
    done: 'done',
    paid: 'paid',
};
export const NOTIFICATION_TYPE = {
    time_off_requested: 'time_off_requested',
    time_off_approved: 'time_off_approved',
    time_off_refused: 'time_off_refused',
    payslip_sent: 'payslip_sent',
    payrun_validated: 'payrun_validated',
};
export const PAYSLIP_WARNING_CODE = {
    MISSING_BANK_ACCOUNT: 'MISSING_BANK_ACCOUNT',
    NO_ACTIVE_CONTRACT: 'NO_ACTIVE_CONTRACT',
    DUPLICATE_PAYSLIP: 'DUPLICATE_PAYSLIP',
    CONTRACT_EXPIRING: 'CONTRACT_EXPIRING',
    ZERO_WORKED_DAYS: 'ZERO_WORKED_DAYS',
    UNRECORDED_ATTENDANCE: 'UNRECORDED_ATTENDANCE',
};
export const ERROR_CODE = {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL: 'INTERNAL',
};
