export type DayBreakdown = {
  scheduledDays: string;
  workedDays: string;
  paidLeaveDays: string;
  unpaidLeaveDays: string;
  absentDays: string;
  overtimeHours: string;
};

export function computeDayBreakdown(_input: {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
}): DayBreakdown {
  // TODO: STUB
  return {
    scheduledDays: '22.00',
    workedDays: '20.00',
    paidLeaveDays: '1.00',
    unpaidLeaveDays: '0.00',
    absentDays: '1.00',
    overtimeHours: '4.50',
  };
}
