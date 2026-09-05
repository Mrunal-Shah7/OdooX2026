export async function getPayrollDashboard(_query: {
  period?: string;
  departmentId?: string;
  employeeType?: string;
}) {
  // TODO: STUB
  return {
    period: '2026-01',
    kpis: {
      totalNetPaid: '425000.00',
      currency: 'INR' as const,
      netChangePercent: '4.20',
      payslipsGenerated: 48,
      payslipsPaid: 42,
      payslipsPending: 6,
      averageSalary: '85000.00',
      approvedTimeOffDays: '12.00',
      attendanceHealthPercent: '94.50',
    },
    salaryByDepartment: [
      {
        departmentId: '33333333-3333-4333-8333-333333333333',
        departmentName: 'Engineering',
        headcount: 12,
        totalNet: '1020000.00',
      },
    ],
    monthlyTrend: [
      { period: '2025-11', totalNet: '380000.00' },
      { period: '2025-12', totalNet: '410000.00' },
      { period: '2026-01', totalNet: '425000.00' },
    ],
    statusSplit: { paid: 42, done: 3, computed: 2, draft: 1 },
    alerts: [
      {
        code: 'MISSING_BANK_ACCOUNT',
        message: 'Employees missing bank details',
        count: 2,
        linkPath: '/employees',
      },
    ],
    attendanceOverview: {
      present: 180,
      late: 8,
      absent: 4,
      overtimeHours: '24.50',
      missingCheckOuts: 3,
      manualEdits: 1,
      coveragePercent: '94.50',
    },
    timeOffOverview: [
      {
        timeOffType: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Annual Leave',
          code: 'AL',
          unit: 'days' as const,
          color: '#4CAF50',
        },
        approvedDays: '12.00',
        pending: 3,
        remainingBalance: '156.00',
      },
    ],
  };
}
