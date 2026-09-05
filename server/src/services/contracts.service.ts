import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { paginationMeta } from '../lib/pagination.js';

function mapContract(c: {
  id: string;
  reference: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    department: { name: string };
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  jobPosition: string;
  workingSchedule: {
    id: string;
    name: string;
    hoursPerWeek: Prisma.Decimal;
  };
  salaryStructure: {
    id: string;
    name: string;
    code: string;
  };
  startDate: Date;
  endDate: Date | null;
  wage: Prisma.Decimal;
  currency: string;
  status: string;
  notes: string | null;
}) {
  return {
    id: c.id,
    reference: c.reference,
    employee: {
      id: c.employee.id,
      firstName: c.employee.firstName,
      lastName: c.employee.lastName,
      workEmail: c.employee.workEmail,
      jobPosition: c.employee.jobPosition,
      departmentName: c.employee.department.name,
    },
    department: {
      id: c.department.id,
      name: c.department.name,
      code: c.department.code,
    },
    jobPosition: c.jobPosition,
    workingSchedule: {
      id: c.workingSchedule.id,
      name: c.workingSchedule.name,
      hoursPerWeek: c.workingSchedule.hoursPerWeek.toString(),
    },
    salaryStructure: {
      id: c.salaryStructure.id,
      name: c.salaryStructure.name,
      code: c.salaryStructure.code,
    },
    startDate: c.startDate instanceof Date ? c.startDate.toISOString().slice(0, 10) : String(c.startDate).slice(0, 10),
    endDate: c.endDate ? (c.endDate instanceof Date ? c.endDate.toISOString().slice(0, 10) : String(c.endDate).slice(0, 10)) : null,
    wage: c.wage.toString(),
    currency: c.currency as 'INR' | 'USD',
    status: c.status as 'draft' | 'running' | 'expired' | 'cancelled',
    notes: c.notes,
  };
}

const contractIncludes = {
  employee: {
    include: {
      department: true,
    },
  },
  department: true,
  workingSchedule: true,
  salaryStructure: true,
};

async function checkOverlap(
  employeeId: string,
  startDateStr: string,
  endDateStr?: string | null,
  excludeContractId?: string,
) {
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date('9999-12-31');

  const runningContracts = await prisma.contract.findMany({
    where: {
      employeeId,
      status: 'running',
      ...(excludeContractId ? { id: { not: excludeContractId } } : {}),
    },
  });

  for (const rc of runningContracts) {
    const rcStart = rc.startDate;
    const rcEnd = rc.endDate ?? new Date('9999-12-31');
    if (start <= rcEnd && rcStart <= end) {
      throw ApiError.conflict(`Overlaps with contract ${rc.reference}`);
    }
  }
}

async function generateContractReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CON/${year}/`;
  const count = await prisma.contract.count({
    where: {
      reference: { startsWith: prefix },
    },
  });
  const num = (count + 1).toString().padStart(4, '0');
  return `${prefix}${num}`;
}

export async function listContracts(query: {
  q?: string;
  employeeId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}, scopedEmployeeId?: string) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ContractWhereInput = {};

  if (scopedEmployeeId) {
    where.employeeId = scopedEmployeeId;
  }

  if (!scopedEmployeeId && query.employeeId) {
    where.employeeId = query.employeeId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.q) {
    const q = query.q.trim();
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { jobPosition: { contains: q, mode: 'insensitive' } },
      { employee: { firstName: { contains: q, mode: 'insensitive' } } },
      { employee: { lastName: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: contractIncludes,
    }),
  ]);

  return {
    data: rows.map(mapContract),
    meta: paginationMeta(page, pageSize, total),
  };
}

export async function createContract(body: {
  employeeId: string;
  departmentId: string;
  jobPosition: string;
  workingScheduleId: string;
  salaryStructureId: string;
  startDate: string;
  endDate?: string | null;
  wage: string;
  currency: 'INR' | 'USD';
  status?: 'draft' | 'running' | 'expired' | 'cancelled';
  notes?: string | null;
}) {
  const targetStatus = body.status ?? 'draft';

  if (targetStatus === 'running') {
    await checkOverlap(body.employeeId, body.startDate, body.endDate);
  }

  const reference = await generateContractReference();

  const created = await prisma.contract.create({
    data: {
      reference,
      employeeId: body.employeeId,
      departmentId: body.departmentId,
      jobPosition: body.jobPosition,
      workingScheduleId: body.workingScheduleId,
      salaryStructureId: body.salaryStructureId,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      wage: new Prisma.Decimal(body.wage),
      currency: body.currency,
      status: targetStatus,
      notes: body.notes ?? null,
    },
    include: contractIncludes,
  });

  return mapContract(created);
}

export async function getContract(id: string, scopedEmployeeId?: string) {
  const c = await prisma.contract.findUnique({
    where: { id },
    include: contractIncludes,
  });

  if (!c || (scopedEmployeeId && c.employeeId !== scopedEmployeeId)) {
    throw ApiError.notFound('Contract not found');
  }

  return mapContract(c);
}

export async function updateContract(
  id: string,
  body: Partial<{
    departmentId: string;
    jobPosition: string;
    workingScheduleId: string;
    salaryStructureId: string;
    startDate: string;
    endDate: string | null;
    wage: string;
    currency: 'INR' | 'USD';
    status: 'draft' | 'running' | 'expired' | 'cancelled';
    notes: string | null;
  }>,
) {
  const current = await prisma.contract.findUnique({
    where: { id },
    include: contractIncludes,
  });

  if (!current) {
    throw ApiError.notFound('Contract not found');
  }

  const nextStatus = body.status ?? current.status;
  const nextStart = body.startDate ?? current.startDate.toISOString().slice(0, 10);
  const nextEnd = body.endDate !== undefined ? body.endDate : (current.endDate ? current.endDate.toISOString().slice(0, 10) : null);

  if (nextStatus === 'running') {
    await checkOverlap(current.employeeId, nextStart, nextEnd, id);
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: {
      ...(body.departmentId !== undefined ? { departmentId: body.departmentId } : {}),
      ...(body.jobPosition !== undefined ? { jobPosition: body.jobPosition } : {}),
      ...(body.workingScheduleId !== undefined ? { workingScheduleId: body.workingScheduleId } : {}),
      ...(body.salaryStructureId !== undefined ? { salaryStructureId: body.salaryStructureId } : {}),
      ...(body.startDate !== undefined ? { startDate: new Date(body.startDate) } : {}),
      ...(body.endDate !== undefined ? { endDate: body.endDate ? new Date(body.endDate) : null } : {}),
      ...(body.wage !== undefined ? { wage: new Prisma.Decimal(body.wage) } : {}),
      ...(body.currency !== undefined ? { currency: body.currency } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    include: contractIncludes,
  });

  return mapContract(updated);
}
