import { prisma } from '../../db/client.js';
import { ApiError } from '../../lib/apiError.js';
import { paginationMeta } from '../../lib/pagination.js';
import { renderPayslipPdf } from './payslipPdf.js';

export async function listPayslips(query: {
  page: number;
  pageSize: number;
  employeeId?: string;
  payrunId?: string;
}) {
  const { page, pageSize, employeeId, payrunId } = query;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (employeeId) where.employeeId = employeeId;
  if (payrunId) where.payrunId = payrunId;

  const [total, items] = await Promise.all([
    prisma.payslip.count({ where }),
    prisma.payslip.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { periodStart: 'desc' },
      include: {
        payrun: { select: { name: true } },
        employee: {
          include: { department: true },
        },
        salaryStructure: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  const data = items.map((ps) => {
    const emp = ps.employee;
    return {
      id: ps.id,
      payrunId: ps.payrunId,
      payrunName: ps.payrun?.name || '',
      employee: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        workEmail: emp.workEmail,
        jobPosition: emp.jobPosition,
        departmentName: emp.department?.name || 'Unassigned',
      },
      contract: null,
      salaryStructure: ps.salaryStructure,
      periodStart: ps.periodStart.toISOString().slice(0, 10),
      periodEnd: ps.periodEnd.toISOString().slice(0, 10),
      currency: ps.currency as 'INR' | 'USD',
      payoutCurrency: ps.payoutCurrency as 'INR' | 'USD',
      exchangeRate: ps.exchangeRate.toString(),
      scheduledDays: ps.scheduledDays.toString(),
      workedDays: ps.workedDays.toString(),
      paidLeaveDays: ps.paidLeaveDays.toString(),
      unpaidLeaveDays: ps.unpaidLeaveDays.toString(),
      absentDays: ps.absentDays.toString(),
      overtimeHours: ps.overtimeHours.toString(),
      proration: ps.proration.toString(),
      basic: ps.basic.toString(),
      gross: ps.gross.toString(),
      totalDeductions: ps.totalDeductions.toString(),
      net: ps.net.toString(),
      status: ps.status as 'draft' | 'computed' | 'done' | 'paid',
      archived: ps.archivedAt !== null,
      sentAt: ps.sentAt ? ps.sentAt.toISOString() : null,
      warnings: Array.isArray(ps.warnings) ? (ps.warnings as any[]) : [],
    };
  });

  return {
    data,
    meta: paginationMeta(page, pageSize, total),
  };
}

export async function getPayslip(id: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: {
      payrun: { select: { name: true } },
      employee: {
        include: { department: true },
      },
      contract: true,
      salaryStructure: { select: { id: true, name: true, code: true } },
      lines: {
        orderBy: [{ sequence: 'asc' }, { ruleCode: 'asc' }],
      },
    },
  });

  if (!payslip) {
    throw ApiError.notFound('Payslip not found');
  }

  const emp = payslip.employee;

  return {
    payslip: {
      id: payslip.id,
      payrunId: payslip.payrunId,
      payrunName: payslip.payrun?.name || '',
      employee: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        workEmail: emp.workEmail,
        jobPosition: emp.jobPosition,
        departmentName: emp.department?.name || 'Unassigned',
      },
      contract: payslip.contract
        ? {
            id: payslip.contract.id,
            reference: payslip.contract.reference,
            wage: payslip.contract.wage.toString(),
            currency: payslip.contract.currency,
          }
        : null,
      salaryStructure: payslip.salaryStructure,
      periodStart: payslip.periodStart.toISOString().slice(0, 10),
      periodEnd: payslip.periodEnd.toISOString().slice(0, 10),
      currency: payslip.currency as 'INR' | 'USD',
      payoutCurrency: payslip.payoutCurrency as 'INR' | 'USD',
      exchangeRate: payslip.exchangeRate.toString(),
      scheduledDays: payslip.scheduledDays.toString(),
      workedDays: payslip.workedDays.toString(),
      paidLeaveDays: payslip.paidLeaveDays.toString(),
      unpaidLeaveDays: payslip.unpaidLeaveDays.toString(),
      absentDays: payslip.absentDays.toString(),
      overtimeHours: payslip.overtimeHours.toString(),
      proration: payslip.proration.toString(),
      basic: payslip.basic.toString(),
      gross: payslip.gross.toString(),
      totalDeductions: payslip.totalDeductions.toString(),
      net: payslip.net.toString(),
      status: payslip.status as 'draft' | 'computed' | 'done' | 'paid',
      archived: payslip.archivedAt !== null,
      sentAt: payslip.sentAt ? payslip.sentAt.toISOString() : null,
      warnings: Array.isArray(payslip.warnings) ? (payslip.warnings as any[]) : [],
    },
    lines: payslip.lines.map((l) => ({
      ruleCode: l.ruleCode,
      ruleName: l.ruleName,
      category: l.category as 'basic' | 'allowance' | 'gross' | 'deduction' | 'net',
      sequence: l.sequence,
      amount: l.amount.toString(),
    })),
  };
}

export async function archivePayslip(id: string) {
  const payslip = await prisma.payslip.findUnique({ where: { id } });
  if (!payslip) {
    throw ApiError.notFound('Payslip not found');
  }

  const updated = await prisma.payslip.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  const detail = await getPayslip(updated.id);
  return detail.payslip;
}

export async function getPayslipPdf(id: string): Promise<Buffer> {
  const detail = await getPayslip(id);
  return renderPayslipPdf(detail);
}
