export declare const USER_ROLE: {
    readonly employee: "employee";
    readonly hr_manager: "hr_manager";
    readonly hr_payroll_user: "hr_payroll_user";
    readonly hr_payroll_manager: "hr_payroll_manager";
    readonly admin: "admin";
};
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
/** Ascending privilege. Higher index inherits capabilities of lower ones. */
export declare const ROLE_ORDER: readonly ["employee", "hr_manager", "hr_payroll_user", "hr_payroll_manager", "admin"];
export declare const USER_STATUS: {
    readonly invited: "invited";
    readonly active: "active";
    readonly disabled: "disabled";
};
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
export declare const AUTH_TOKEN_PURPOSE: {
    readonly invite: "invite";
    readonly password_reset: "password_reset";
};
export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSE)[keyof typeof AUTH_TOKEN_PURPOSE];
export declare const CURRENCY: {
    readonly INR: "INR";
    readonly USD: "USD";
};
export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];
export declare const EMPLOYEE_TYPE: {
    readonly full_time: "full_time";
    readonly part_time: "part_time";
    readonly contract: "contract";
    readonly intern: "intern";
};
export type EmployeeType = (typeof EMPLOYEE_TYPE)[keyof typeof EMPLOYEE_TYPE];
export declare const EMPLOYEE_STATUS: {
    readonly active: "active";
    readonly inactive: "inactive";
};
export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];
export declare const CONTRACT_STATUS: {
    readonly draft: "draft";
    readonly running: "running";
    readonly expired: "expired";
    readonly cancelled: "cancelled";
};
export type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];
export declare const ATTENDANCE_STATUS: {
    readonly present: "present";
    readonly late: "late";
    readonly absent: "absent";
    readonly half_day: "half_day";
    readonly on_leave: "on_leave";
};
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
export declare const TIME_OFF_UNIT: {
    readonly days: "days";
    readonly hours: "hours";
};
export type TimeOffUnit = (typeof TIME_OFF_UNIT)[keyof typeof TIME_OFF_UNIT];
export declare const TIME_OFF_DURATION_TYPE: {
    readonly full_day: "full_day";
    readonly half_day: "half_day";
    readonly hours: "hours";
};
export type TimeOffDurationType = (typeof TIME_OFF_DURATION_TYPE)[keyof typeof TIME_OFF_DURATION_TYPE];
export declare const ALLOCATION_STATUS: {
    readonly draft: "draft";
    readonly approved: "approved";
    readonly refused: "refused";
};
export type AllocationStatus = (typeof ALLOCATION_STATUS)[keyof typeof ALLOCATION_STATUS];
export declare const REQUEST_STATUS: {
    readonly to_approve: "to_approve";
    readonly approved: "approved";
    readonly refused: "refused";
    readonly cancelled: "cancelled";
};
export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
export declare const RULE_CATEGORY: {
    readonly basic: "basic";
    readonly allowance: "allowance";
    readonly gross: "gross";
    readonly deduction: "deduction";
    readonly net: "net";
};
export type RuleCategory = (typeof RULE_CATEGORY)[keyof typeof RULE_CATEGORY];
export declare const RULE_COMPUTATION: {
    readonly fixed: "fixed";
    readonly percentage: "percentage";
    readonly formula: "formula";
};
export type RuleComputation = (typeof RULE_COMPUTATION)[keyof typeof RULE_COMPUTATION];
export declare const PERCENTAGE_BASE: {
    readonly contract_wage: "contract_wage";
    readonly basic: "basic";
    readonly gross: "gross";
};
export type PercentageBase = (typeof PERCENTAGE_BASE)[keyof typeof PERCENTAGE_BASE];
export declare const PAYRUN_STATUS: {
    readonly draft: "draft";
    readonly computed: "computed";
    readonly validated: "validated";
    readonly paid: "paid";
};
export type PayrunStatus = (typeof PAYRUN_STATUS)[keyof typeof PAYRUN_STATUS];
export declare const PAYSLIP_STATUS: {
    readonly draft: "draft";
    readonly computed: "computed";
    readonly done: "done";
    readonly paid: "paid";
};
export type PayslipStatus = (typeof PAYSLIP_STATUS)[keyof typeof PAYSLIP_STATUS];
export declare const NOTIFICATION_TYPE: {
    readonly time_off_requested: "time_off_requested";
    readonly time_off_approved: "time_off_approved";
    readonly time_off_refused: "time_off_refused";
    readonly payslip_sent: "payslip_sent";
    readonly payrun_validated: "payrun_validated";
};
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export declare const PAYSLIP_WARNING_CODE: {
    readonly MISSING_BANK_ACCOUNT: "MISSING_BANK_ACCOUNT";
    readonly NO_ACTIVE_CONTRACT: "NO_ACTIVE_CONTRACT";
    readonly DUPLICATE_PAYSLIP: "DUPLICATE_PAYSLIP";
    readonly CONTRACT_EXPIRING: "CONTRACT_EXPIRING";
    readonly ZERO_WORKED_DAYS: "ZERO_WORKED_DAYS";
    readonly UNRECORDED_ATTENDANCE: "UNRECORDED_ATTENDANCE";
};
export type PayslipWarningCode = (typeof PAYSLIP_WARNING_CODE)[keyof typeof PAYSLIP_WARNING_CODE];
export declare const ERROR_CODE: {
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly UNAUTHENTICATED: "UNAUTHENTICATED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly INTERNAL: "INTERNAL";
};
export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
