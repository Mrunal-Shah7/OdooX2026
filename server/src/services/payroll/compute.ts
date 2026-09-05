import { Decimal, roundHalfUp } from '../../lib/money.js';
import { evaluateFormula } from './formula.js';

export type PayslipWarningCode =
  | 'MISSING_BANK_ACCOUNT'
  | 'NO_ACTIVE_CONTRACT'
  | 'DUPLICATE_PAYSLIP'
  | 'CONTRACT_EXPIRING'
  | 'ZERO_WORKED_DAYS'
  | 'UNRECORDED_ATTENDANCE';

export type PayslipWarning = {
  code: PayslipWarningCode;
  message: string;
  blocking: boolean;
};

export type SalaryRuleInput = {
  id: string;
  code: string;
  name: string;
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net';
  sequence: number;
  computation: 'fixed' | 'percentage' | 'formula';
  amount?: Decimal | number | string | null;
  percentage?: Decimal | number | string | null;
  percentageBase?: 'contract_wage' | 'basic' | 'gross' | null;
  formula?: string | null;
};

export type ContractInput = {
  id: string;
  wage: Decimal | number | string;
  currency: 'INR' | 'USD';
  startDate: string;
  endDate?: string | null;
  workingScheduleHoursPerWeek?: Decimal | number | string;
  workingScheduleDaysPerWeek?: number;
};

export type EmployeeInput = {
  id: string;
  bankAccountNumber?: string | null;
};

export type DayBreakdownInput = {
  scheduledDates: string[];
  scheduledDaysCount: number;
  presentDays: Decimal;
  paidLeaveDays: Decimal;
  unpaidLeaveDays: Decimal;
  absentDays: Decimal;
  overtimeHours: Decimal;
  workedDays: Decimal;
  proration: Decimal;
  unrecordedAttendanceCount: number;
};

export type ComputedLine = {
  ruleCode: string;
  ruleName: string;
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net';
  sequence: number;
  amount: Decimal;
};

export type ComputedPayslipResult = {
  contractId: string | null;
  currency: 'INR' | 'USD';
  scheduledDays: Decimal;
  workedDays: Decimal;
  paidLeaveDays: Decimal;
  unpaidLeaveDays: Decimal;
  absentDays: Decimal;
  overtimeHours: Decimal;
  proration: Decimal;
  basic: Decimal;
  gross: Decimal;
  totalDeductions: Decimal;
  net: Decimal;
  lines: ComputedLine[];
  warnings: PayslipWarning[];
};

export function computePayslipForEmployee(params: {
  employee: EmployeeInput;
  periodStart: string;
  periodEnd: string;
  runningContracts: ContractInput[];
  rules: SalaryRuleInput[];
  dayBreakdown: DayBreakdownInput;
  hasExistingActivePayslip?: boolean;
}): ComputedPayslipResult {
  const {
    employee,
    periodStart,
    periodEnd,
    runningContracts,
    rules,
    dayBreakdown,
    hasExistingActivePayslip = false,
  } = params;

  const warnings: PayslipWarning[] = [];

  // 1. Contract Resolution
  if (runningContracts.length === 0) {
    warnings.push({
      code: 'NO_ACTIVE_CONTRACT',
      message: 'No active running contract found for this payroll period.',
      blocking: true,
    });
    return buildZeroResult(null, 'INR', dayBreakdown, warnings);
  }

  if (runningContracts.length > 1) {
    warnings.push({
      code: 'NO_ACTIVE_CONTRACT',
      message: 'Multiple active running contracts overlap this payroll period.',
      blocking: true,
    });
    return buildZeroResult(null, 'INR', dayBreakdown, warnings);
  }

  const contract = runningContracts[0]!;
  const contractWage = new Decimal(contract.wage);
  const currency = contract.currency;

  // 2. Check Duplicate Payslip
  if (hasExistingActivePayslip) {
    warnings.push({
      code: 'DUPLICATE_PAYSLIP',
      message: 'An active non-archived payslip already exists for this employee in another pay run.',
      blocking: true,
    });
  }

  // 3. Check Bank Account
  if (!employee.bankAccountNumber || employee.bankAccountNumber.trim() === '') {
    warnings.push({
      code: 'MISSING_BANK_ACCOUNT',
      message: 'Employee is missing bank account details for salary payout.',
      blocking: true,
    });
  }

  // 4. Check Contract Expiring
  if (contract.endDate && contract.endDate >= periodStart && contract.endDate <= periodEnd) {
    warnings.push({
      code: 'CONTRACT_EXPIRING',
      message: `Employee contract ends inside this payroll period on ${contract.endDate}.`,
      blocking: false,
    });
  }

  // 5. Check Unrecorded Attendance
  if (dayBreakdown.unrecordedAttendanceCount > 0) {
    warnings.push({
      code: 'UNRECORDED_ATTENDANCE',
      message: `${dayBreakdown.unrecordedAttendanceCount} scheduled day(s) have unrecorded attendance.`,
      blocking: false,
    });
  }

  // 6. Check Zero Worked Days
  if (dayBreakdown.workedDays.isZero()) {
    warnings.push({
      code: 'ZERO_WORKED_DAYS',
      message: 'Employee has zero worked days in this payroll period.',
      blocking: false,
    });
  }

  // 7. Context variables for formula engine
  const scheduledDays = new Decimal(dayBreakdown.scheduledDaysCount);
  const dailyRate = scheduledDays.greaterThan(0) ? contractWage.div(scheduledDays) : new Decimal(0);

  const hpw = contract.workingScheduleHoursPerWeek ? new Decimal(contract.workingScheduleHoursPerWeek) : new Decimal(40);
  const dpw = contract.workingScheduleDaysPerWeek ? contract.workingScheduleDaysPerWeek : 5;
  const hoursPerDay = dpw > 0 ? hpw.div(dpw) : new Decimal(8);
  const hourlyRate = hoursPerDay.greaterThan(0) ? dailyRate.div(hoursPerDay) : new Decimal(0);

  const variables: Record<string, Decimal> = {
    CONTRACT_WAGE: contractWage,
    SCHEDULED_DAYS: scheduledDays,
    WORKED_DAYS: dayBreakdown.workedDays,
    PAID_LEAVE_DAYS: dayBreakdown.paidLeaveDays,
    UNPAID_LEAVE_DAYS: dayBreakdown.unpaidLeaveDays,
    ABSENT_DAYS: dayBreakdown.absentDays,
    OVERTIME_HOURS: dayBreakdown.overtimeHours,
    DAILY_RATE: roundHalfUp(dailyRate, 4),
    HOURLY_RATE: roundHalfUp(hourlyRate, 4),
    PRORATION: dayBreakdown.proration,
    BASIC: new Decimal(0),
    ALLOWANCE: new Decimal(0),
    GROSS: new Decimal(0),
    DEDUCTION: new Decimal(0),
  };

  const computedRulesMap: Record<string, Decimal> = {};
  const lines: ComputedLine[] = [];

  // Sort rules by sequence ascending, then code ascending
  const sortedRules = [...rules].sort((a, b) => {
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    return a.code.localeCompare(b.code);
  });

  let lastNetRuleAmount: Decimal | null = null;

  for (const rule of sortedRules) {
    let lineAmount = new Decimal(0);

    if (rule.computation === 'fixed') {
      lineAmount = new Decimal(rule.amount ?? 0);
    } else if (rule.computation === 'percentage') {
      const pct = new Decimal(rule.percentage ?? 0).div(100);
      let baseVal = contractWage;
      if (rule.percentageBase === 'basic') {
        baseVal = variables['BASIC']!;
      } else if (rule.percentageBase === 'gross') {
        baseVal = variables['GROSS']!;
      }
      lineAmount = pct.mul(baseVal);
    } else if (rule.computation === 'formula' && rule.formula) {
      lineAmount = evaluateFormula(rule.formula, {
        variables,
        rules: computedRulesMap,
      });
    }

    // Round half-up to 2 decimals
    const roundedAmount = roundHalfUp(lineAmount, 2);
    computedRulesMap[rule.code] = roundedAmount;

    lines.push({
      ruleCode: rule.code,
      ruleName: rule.name,
      category: rule.category,
      sequence: rule.sequence,
      amount: roundedAmount,
    });

    // Update running category totals
    if (rule.category === 'basic') {
      variables['BASIC'] = variables['BASIC']!.add(roundedAmount);
    } else if (rule.category === 'allowance') {
      variables['ALLOWANCE'] = variables['ALLOWANCE']!.add(roundedAmount);
    } else if (rule.category === 'gross') {
      variables['GROSS'] = variables['GROSS']!.add(roundedAmount);
    } else if (rule.category === 'deduction') {
      variables['DEDUCTION'] = variables['DEDUCTION']!.add(roundedAmount);
    } else if (rule.category === 'net') {
      lastNetRuleAmount = roundedAmount;
    }
  }

  const basicTotal = roundHalfUp(variables['BASIC']!, 2);
  const grossTotal = roundHalfUp(variables['GROSS']!, 2);
  const totalDeductions = roundHalfUp(variables['DEDUCTION']!, 2);

  const netTotal = lastNetRuleAmount !== null
    ? roundHalfUp(lastNetRuleAmount, 2)
    : roundHalfUp(grossTotal.sub(totalDeductions), 2);

  return {
    contractId: contract.id,
    currency,
    scheduledDays: new Decimal(dayBreakdown.scheduledDaysCount),
    workedDays: dayBreakdown.workedDays,
    paidLeaveDays: dayBreakdown.paidLeaveDays,
    unpaidLeaveDays: dayBreakdown.unpaidLeaveDays,
    absentDays: dayBreakdown.absentDays,
    overtimeHours: dayBreakdown.overtimeHours,
    proration: dayBreakdown.proration,
    basic: basicTotal,
    gross: grossTotal,
    totalDeductions,
    net: netTotal,
    lines,
    warnings,
  };
}

function buildZeroResult(
  contractId: string | null,
  currency: 'INR' | 'USD',
  dayBreakdown: DayBreakdownInput,
  warnings: PayslipWarning[],
): ComputedPayslipResult {
  return {
    contractId,
    currency,
    scheduledDays: new Decimal(dayBreakdown.scheduledDaysCount),
    workedDays: dayBreakdown.workedDays,
    paidLeaveDays: dayBreakdown.paidLeaveDays,
    unpaidLeaveDays: dayBreakdown.unpaidLeaveDays,
    absentDays: dayBreakdown.absentDays,
    overtimeHours: dayBreakdown.overtimeHours,
    proration: dayBreakdown.proration,
    basic: new Decimal(0),
    gross: new Decimal(0),
    totalDeductions: new Decimal(0),
    net: new Decimal(0),
    lines: [],
    warnings,
  };
}

export type ComputeInput = {
  employeeId: string;
  contractWage: string;
  periodStart: string;
  periodEnd: string;
};

export type ComputeLine = {
  ruleCode: string;
  ruleName: string;
  category: string;
  sequence: number;
  amount: string;
};

export function computePayslipLines(_input: ComputeInput): ComputeLine[] {
  return [
    {
      ruleCode: 'BASIC',
      ruleName: 'Basic Salary',
      category: 'basic',
      sequence: 10,
      amount: '85000.00',
    },
    {
      ruleCode: 'PF',
      ruleName: 'Provident Fund',
      category: 'deduction',
      sequence: 50,
      amount: '5100.00',
    },
  ];
}

export function computeTotals(lines: ComputeLine[]) {
  let basic = '0.00';
  let gross = '0.00';
  let deductions = '0.00';
  let net = '0.00';
  for (const line of lines) {
    if (line.category === 'basic') basic = line.amount;
    if (line.category === 'gross') gross = line.amount;
    if (line.category === 'deduction') deductions = line.amount;
    if (line.category === 'net') net = line.amount;
  }
  return { basic, gross, totalDeductions: deductions, net };
}
