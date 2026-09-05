import { prisma } from '../../db/client.js';
import { ApiError } from '../../lib/apiError.js';
import { Decimal, moneyString, roundHalfUp } from '../../lib/money.js';
import { paginationMeta } from '../../lib/pagination.js';
import { NOTIFICATION_TYPE } from '../../../../shared/constants.js';
import { getDayBreakdown } from '../dayAccounting.service.js';
import { create as createNotification } from '../notifications.service.js';
import { computePayslipForEmployee } from './compute.js';

async function notifyQuietly(input: {
  userId: string;
  type: (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
  title: string;
  body: string;
  linkPath: string;
}): Promise<void> {
  try {
    await createNotification(input);
  } catch {
    // Fire-and-forget; notification failure never fails the parent operation
  }
}

export async function listEligibleEmployees(query: {
  periodStart: string;
  periodEnd: string;
  structureId: string;
  employeeType?: string;
}) {
  const { periodStart, periodEnd, structureId, employeeType } = query;

  const pStart = new Date(`${periodStart}T00:00:00.000Z`);
  const pEnd = new Date(`${periodEnd}T23:59:59.999Z`);

  // Find active contracts overlapping the period and matching salary structure
  const whereContract: any = {
    status: 'running',
    salaryStructureId: structureId,
    startDate: { lte: pEnd },
    OR: [{ endDate: null }, { endDate: { gte: pStart } }],
    employee: {
      status: 'active',
    },
  };

  if (employeeType && employeeType !== 'all') {
    whereContract.employee.employeeType = employeeType;
  }

  const contracts = await prisma.contract.findMany({
    where: whereContract,
    include: {
      employee: {
        include: {
          department: true,
          workingSchedule: true,
        },
      },
    },
    orderBy: { employee: { firstName: 'asc' } },
  });

  // Check if employee already has a paid payslip for this period
  const paidPayslips = await prisma.payslip.findMany({
    where: {
      periodStart: pStart,
      status: 'paid',
      archivedAt: null,
    },
    select: { employeeId: true },
  });
  const paidEmployeeIds = new Set(paidPayslips.map((p) => p.employeeId));

  const data = contracts.map((c) => {
    const emp = c.employee;
    const hpw = emp.workingSchedule?.hoursPerWeek ? emp.workingSchedule.hoursPerWeek.toString() : '40.00';
    return {
      employee: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        workEmail: emp.workEmail,
        jobPosition: emp.jobPosition,
        departmentName: emp.department?.name || 'Unassigned',
      },
      contractId: c.id,
      workingHours: hpw,
      contractStartDate: c.startDate.toISOString().slice(0, 10),
      wage: c.wage.toString(),
      currency: c.currency as 'INR' | 'USD',
      alreadyPaid: paidEmployeeIds.has(emp.id),
    };
  });

  return {
    data,
    meta: paginationMeta(1, Math.max(1, data.length), data.length),
  };
}

export async function listPayruns(query: { page: number; pageSize: number; q?: string }) {
  const { page, pageSize, q } = query;
  const skip = (page - 1) * pageSize;

  const where = q
    ? {
        name: { contains: q, mode: 'insensitive' as const },
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.payrun.count({ where }),
    prisma.payrun.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { periodStart: 'desc' },
      include: {
        salaryStructure: {
          select: { id: true, name: true, code: true },
        },
        payslips: {
          where: { archivedAt: null },
          select: {
            id: true,
            net: true,
            warnings: true,
          },
        },
      },
    }),
  ]);

  const data = items.map((pr) => {
    let warningCount = 0;
    let totalNet = new Decimal(0);

    pr.payslips.forEach((ps) => {
      totalNet = totalNet.add(new Decimal(ps.net.toString()));
      if (Array.isArray(ps.warnings)) {
        warningCount += (ps.warnings as any[]).length;
      }
    });

    return {
      id: pr.id,
      name: pr.name,
      salaryStructure: pr.salaryStructure,
      employeeType: pr.employeeType,
      periodStart: pr.periodStart.toISOString().slice(0, 10),
      periodEnd: pr.periodEnd.toISOString().slice(0, 10),
      status: pr.status,
      payoutCurrency: pr.payoutCurrency,
      exchangeRate: pr.exchangeRate.toString(),
      payslipCount: pr.payslips.length,
      warningCount,
      totalNet: moneyString(totalNet),
      paidAt: pr.paidAt ? pr.paidAt.toISOString() : null,
    };
  });

  return {
    data,
    meta: paginationMeta(page, pageSize, total),
  };
}

export async function createPayrun(body: {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  payoutCurrency: 'INR' | 'USD';
  exchangeRate?: string;
  employeeType?: string | null;
  employeeIds: string[];
}) {
  const company = await prisma.company.findFirst();
  if (!company) {
    throw ApiError.internal('Company record not found');
  }

  const pStart = new Date(`${body.periodStart}T00:00:00.000Z`);
  const pEnd = new Date(`${body.periodEnd}T23:59:59.999Z`);

  const structure = await prisma.salaryStructure.findUnique({
    where: { id: body.salaryStructureId },
  });
  if (!structure) {
    throw ApiError.notFound('Salary structure not found');
  }

  // Create payrun and draft payslips inside a transaction
  const result = await prisma.$transaction(async (tx) => {
    const payrun = await tx.payrun.create({
      data: {
        companyId: company.id,
        name: body.name,
        salaryStructureId: body.salaryStructureId,
        employeeType: body.employeeType ?? null,
        periodStart: pStart,
        periodEnd: pEnd,
        payoutCurrency: body.payoutCurrency,
        exchangeRate: new Decimal(body.exchangeRate ?? '1.000000'),
        status: 'draft',
      },
    });

    // Create draft payslips for selected employees
    const createdPayslips = await Promise.all(
      body.employeeIds.map(async (empId) => {
        // Find employee's active running contract
        const contract = await tx.contract.findFirst({
          where: {
            employeeId: empId,
            status: 'running',
            startDate: { lte: pEnd },
            OR: [{ endDate: null }, { endDate: { gte: pStart } }],
          },
        });

        return tx.payslip.create({
          data: {
            payrunId: payrun.id,
            employeeId: empId,
            contractId: contract ? contract.id : null,
            salaryStructureId: body.salaryStructureId,
            periodStart: pStart,
            periodEnd: pEnd,
            currency: contract ? contract.currency : company.baseCurrency,
            payoutCurrency: body.payoutCurrency,
            exchangeRate: new Decimal(body.exchangeRate ?? '1.000000'),
            status: 'draft',
            warnings: [],
          },
        });
      }),
    );

    return { payrun, payslips: createdPayslips };
  });

  return getPayrun(result.payrun.id);
}

export async function getPayrun(id: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      salaryStructure: {
        select: { id: true, name: true, code: true },
      },
      payslips: {
        where: { archivedAt: null },
        include: {
          employee: {
            include: { department: true },
          },
        },
        orderBy: { employee: { firstName: 'asc' } },
      },
    },
  });

  if (!payrun) {
    throw ApiError.notFound('Pay run not found');
  }

  let warningCount = 0;
  let totalNet = new Decimal(0);

  const payslipsSummary = payrun.payslips.map((ps) => {
    const emp = ps.employee;
    const netDec = new Decimal(ps.net.toString());
    totalNet = totalNet.add(netDec);

    const warnings = Array.isArray(ps.warnings) ? (ps.warnings as any[]) : [];
    warningCount += warnings.length;

    return {
      id: ps.id,
      employee: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        workEmail: emp.workEmail,
        jobPosition: emp.jobPosition,
        departmentName: emp.department?.name || 'Unassigned',
      },
      workedDays: ps.workedDays.toString(),
      basic: ps.basic.toString(),
      gross: ps.gross.toString(),
      net: ps.net.toString(),
      currency: ps.currency as 'INR' | 'USD',
      status: ps.status as 'draft' | 'computed' | 'done' | 'paid',
      archived: ps.archivedAt !== null,
      sentAt: ps.sentAt ? ps.sentAt.toISOString() : null,
      warnings,
    };
  });

  return {
    payrun: {
      id: payrun.id,
      name: payrun.name,
      salaryStructure: payrun.salaryStructure,
      employeeType: payrun.employeeType,
      periodStart: payrun.periodStart.toISOString().slice(0, 10),
      periodEnd: payrun.periodEnd.toISOString().slice(0, 10),
      status: payrun.status as 'draft' | 'computed' | 'validated' | 'paid',
      payoutCurrency: payrun.payoutCurrency as 'INR' | 'USD',
      exchangeRate: payrun.exchangeRate.toString(),
      payslipCount: payslipsSummary.length,
      warningCount,
      totalNet: moneyString(totalNet),
      paidAt: payrun.paidAt ? payrun.paidAt.toISOString() : null,
    },
    payslips: payslipsSummary,
  };
}

export async function computePayrun(id: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      salaryStructure: {
        include: {
          rules: {
            where: { active: true },
            orderBy: [{ sequence: 'asc' }, { code: 'asc' }],
          },
        },
      },
      payslips: {
        where: { archivedAt: null },
      },
    },
  });

  if (!payrun) {
    throw ApiError.notFound('Pay run not found');
  }

  if (payrun.status !== 'draft' && payrun.status !== 'computed') {
    throw ApiError.conflict(`Cannot compute pay run in state '${payrun.status}'`);
  }

  const pStartStr = payrun.periodStart.toISOString().slice(0, 10);
  const pEndStr = payrun.periodEnd.toISOString().slice(0, 10);
  const rules = payrun.salaryStructure.rules;

  // Execute computation for each non-archived payslip
  await prisma.$transaction(async (tx) => {
    for (const payslip of payrun.payslips) {
      const emp = await tx.employee.findUnique({
        where: { id: payslip.employeeId },
        select: { id: true, bankAccountNumber: true },
      });

      if (!emp) continue;

      // Find running contracts
      const contracts = await tx.contract.findMany({
        where: {
          employeeId: emp.id,
          status: 'running',
          startDate: { lte: payrun.periodEnd },
          OR: [{ endDate: null }, { endDate: { gte: payrun.periodStart } }],
        },
        include: {
          workingSchedule: {
            select: { hoursPerWeek: true, daysPerWeek: true },
          },
        },
      });

      // Get day breakdown
      const dayBreakdown = await getDayBreakdown({
        employeeId: emp.id,
        contractId: contracts.length === 1 ? contracts[0]!.id : null,
        from: pStartStr,
        to: pEndStr,
      });

      // Check existing active payslips in other payruns
      const existingOtherPayslip = await tx.payslip.findFirst({
        where: {
          employeeId: emp.id,
          periodStart: payrun.periodStart,
          payrunId: { not: payrun.id },
          archivedAt: null,
        },
      });

      const computed = computePayslipForEmployee({
        employee: { id: emp.id, bankAccountNumber: emp.bankAccountNumber },
        periodStart: pStartStr,
        periodEnd: pEndStr,
        runningContracts: contracts.map((c) => ({
          id: c.id,
          wage: c.wage,
          currency: c.currency as 'INR' | 'USD',
          startDate: c.startDate.toISOString().slice(0, 10),
          endDate: c.endDate ? c.endDate.toISOString().slice(0, 10) : null,
          workingScheduleHoursPerWeek: c.workingSchedule?.hoursPerWeek,
          workingScheduleDaysPerWeek: c.workingSchedule?.daysPerWeek,
        })),
        rules: rules.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          category: r.category as any,
          sequence: r.sequence,
          computation: r.computation as any,
          amount: r.amount,
          percentage: r.percentage,
          percentageBase: r.percentageBase as any,
          formula: r.formula,
        })),
        dayBreakdown,
        hasExistingActivePayslip: Boolean(existingOtherPayslip),
      });

      // Update payslip record
      await tx.payslip.update({
        where: { id: payslip.id },
        data: {
          contractId: computed.contractId,
          currency: computed.currency,
          scheduledDays: computed.scheduledDays,
          workedDays: computed.workedDays,
          paidLeaveDays: computed.paidLeaveDays,
          unpaidLeaveDays: computed.unpaidLeaveDays,
          absentDays: computed.absentDays,
          overtimeHours: computed.overtimeHours,
          proration: computed.proration,
          basic: computed.basic,
          gross: computed.gross,
          totalDeductions: computed.totalDeductions,
          net: computed.net,
          status: 'computed',
          warnings: computed.warnings as any,
        },
      });

      // Delete existing lines and recreate computed lines
      await tx.payslipLine.deleteMany({ where: { payslipId: payslip.id } });
      if (computed.lines.length > 0) {
        await tx.payslipLine.createMany({
          data: computed.lines.map((l) => ({
            payslipId: payslip.id,
            ruleCode: l.ruleCode,
            ruleName: l.ruleName,
            category: l.category,
            sequence: l.sequence,
            amount: l.amount,
          })),
        });
      }
    }

    // Update payrun status to computed
    await tx.payrun.update({
      where: { id: payrun.id },
      data: { status: 'computed' },
    });
  });

  return getPayrun(id);
}

export async function validatePayrun(id: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      payslips: {
        where: { archivedAt: null },
      },
    },
  });

  if (!payrun) {
    throw ApiError.notFound('Pay run not found');
  }

  if (payrun.status !== 'computed') {
    throw ApiError.conflict(`Cannot validate pay run in state '${payrun.status}'`);
  }

  // Check if any active payslip has a blocking warning
  for (const ps of payrun.payslips) {
    const warnings = Array.isArray(ps.warnings) ? (ps.warnings as any[]) : [];
    const blocking = warnings.find((w) => w.blocking);
    if (blocking) {
      throw ApiError.conflict(
        `Cannot validate pay run: payslip carries blocking warning '${blocking.code}' (${blocking.message})`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.payrun.update({
      where: { id },
      data: { status: 'validated' },
    });

    await tx.payslip.updateMany({
      where: { payrunId: id, archivedAt: null },
      data: { status: 'done' },
    });
  });

  const payslipCount = payrun.payslips.length;
  const payrollUsers = await prisma.user.findMany({
    where: {
      role: { in: ['hr_payroll_user', 'hr_payroll_manager', 'admin'] },
      status: 'active',
    },
  });
  for (const u of payrollUsers) {
    void notifyQuietly({
      userId: u.id,
      type: NOTIFICATION_TYPE.payrun_validated,
      title: 'Pay run validated',
      body: `${payrun.name} was validated with ${payslipCount} payslips.`,
      linkPath: `/payroll/payruns/${id}`,
    });
  }

  return getPayrun(id);
}

export async function markPayrunPaid(id: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id } });

  if (!payrun) {
    throw ApiError.notFound('Pay run not found');
  }

  if (payrun.status !== 'validated') {
    throw ApiError.conflict(`Cannot mark pay run paid from state '${payrun.status}'`);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payrun.update({
      where: { id },
      data: { status: 'paid', paidAt: now },
    });

    await tx.payslip.updateMany({
      where: { payrunId: id, archivedAt: null },
      data: { status: 'paid' },
    });
  });

  return getPayrun(id);
}

export async function sendPayslips(id: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      payslips: {
        where: { archivedAt: null },
        include: {
          employee: {
            include: {
              user: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!payrun) {
    throw ApiError.notFound('Pay run not found');
  }

  if (payrun.status !== 'paid') {
    throw ApiError.conflict(`Cannot send payslips for pay run in state '${payrun.status}'`);
  }

  const results: { payslipId: string; sent: boolean; error: string | null }[] = [];
  const now = new Date();

  for (const ps of payrun.payslips) {
    try {
      await prisma.payslip.update({
        where: { id: ps.id },
        data: { sentAt: now },
      });
      results.push({ payslipId: ps.id, sent: true, error: null });

      const userId = ps.employee.user?.id;
      if (userId) {
        void notifyQuietly({
          userId,
          type: NOTIFICATION_TYPE.payslip_sent,
          title: 'Payslip available',
          body: `Your payslip for ${payrun.name} has been sent.`,
          linkPath: `/payroll/payslips/${ps.id}`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send failed';
      results.push({ payslipId: ps.id, sent: false, error: message });
    }
  }

  return results;
}
