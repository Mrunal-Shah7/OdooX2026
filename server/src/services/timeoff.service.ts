import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { getDatesInRange, getIsoWeekday, toDateOnly } from '../lib/dates.js';
import { quantityString, roundHalfUp } from '../lib/money.js';
import { paginationMeta, skipTake } from '../lib/pagination.js';
import type {
  AllocationStatus,
  RequestStatus,
  TimeOffDurationType,
  TimeOffUnit,
  UserRole,
} from '../../../shared/constants.js';

function mapEmployeeRef(employee: {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobPosition: string;
  department?: { name: string } | null;
}) {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    workEmail: employee.workEmail,
    jobPosition: employee.jobPosition,
    departmentName: employee.department?.name ?? '',
  };
}

function mapTimeOffTypeRef(type: {
  id: string;
  name: string;
  code: string;
  unit: string;
  color: string;
}) {
  return {
    id: type.id,
    name: type.name,
    code: type.code,
    unit: type.unit as TimeOffUnit,
    color: type.color,
  };
}

function mapTimeOffType(type: {
  id: string;
  name: string;
  code: string;
  unit: string;
  requiresAllocation: boolean;
  isPaid: boolean;
  approvalRole: string;
  color: string;
  active: boolean;
}) {
  return {
    id: type.id,
    name: type.name,
    code: type.code,
    unit: type.unit as TimeOffUnit,
    requiresAllocation: type.requiresAllocation,
    isPaid: type.isPaid,
    approvalRole: type.approvalRole as UserRole,
    color: type.color,
    active: type.active,
  };
}

type AllocationWithRelations = Prisma.TimeOffAllocationGetPayload<{
  include: {
    employee: { include: { department: true } };
    timeOffType: true;
    approver: { include: { department: true } };
    requests: true;
  };
}>;

function mapAllocation(
  allocation: AllocationWithRelations,
  calculatedTaken?: Prisma.Decimal,
) {
  const isDays = allocation.timeOffType.unit === 'days';
  let takenDecimal = calculatedTaken;

  if (takenDecimal === undefined) {
    const approvedRequests = allocation.requests.filter((r) => r.status === 'approved');
    let sum = 0;
    for (const req of approvedRequests) {
      sum += Number(isDays ? req.durationDays : req.durationHours);
    }
    takenDecimal = new Prisma.Decimal(roundHalfUp(sum, 2));
  }

  const allocatedDecimal = allocation.allocated;
  const remainingDecimal = Prisma.Decimal.max(
    new Prisma.Decimal(0),
    allocatedDecimal.sub(takenDecimal),
  );

  return {
    id: allocation.id,
    employee: mapEmployeeRef(allocation.employee),
    timeOffType: mapTimeOffTypeRef(allocation.timeOffType),
    allocated: quantityString(allocation.allocated),
    taken: quantityString(takenDecimal),
    remaining: quantityString(remainingDecimal),
    validFrom: toDateOnly(allocation.validFrom),
    validTo: toDateOnly(allocation.validTo),
    status: allocation.status as AllocationStatus,
    description: allocation.description,
    approver: allocation.approver ? mapEmployeeRef(allocation.approver) : null,
  };
}

type RequestWithRelations = Prisma.TimeOffRequestGetPayload<{
  include: {
    employee: { include: { department: true } };
    timeOffType: true;
    approver: { include: { department: true } };
    allocation: {
      include: {
        employee: { include: { department: true } };
        timeOffType: true;
        approver: { include: { department: true } };
        requests: true;
      };
    };
  };
}>;

function mapRequest(req: RequestWithRelations) {
  return {
    id: req.id,
    employee: mapEmployeeRef(req.employee),
    timeOffType: mapTimeOffTypeRef(req.timeOffType),
    startDate: toDateOnly(req.startDate),
    endDate: toDateOnly(req.endDate),
    durationType: req.durationType as TimeOffDurationType,
    requestedHours: req.requestedHours ? quantityString(req.requestedHours) : null,
    durationDays: quantityString(req.durationDays),
    durationHours: quantityString(req.durationHours),
    status: req.status as RequestStatus,
    reason: req.reason,
    refusalReason: req.refusalReason,
    allocation: req.allocation ? mapAllocation(req.allocation) : null,
    approver: req.approver ? mapEmployeeRef(req.approver) : null,
  };
}

async function sendNotification(
  userId: string,
  type:
    | 'time_off_requested'
    | 'time_off_approved'
    | 'time_off_refused'
    | 'payslip_sent'
    | 'payrun_validated',
  title: string,
  body: string,
  linkPath: string,
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        linkPath,
      },
    });
  } catch {
    // Fire-and-forget; notification failure never fails the parent operation
  }
}

// ============================================================================
// Time Off Types
// ============================================================================

export async function listTimeOffTypes(query: {
  page: number;
  pageSize: number;
  activeOnly?: boolean;
}) {
  const where: Prisma.TimeOffTypeWhereInput = {};
  if (query.activeOnly) {
    where.active = true;
  }

  const { skip, take } = skipTake(query.page, query.pageSize);
  const [total, types] = await Promise.all([
    prisma.timeOffType.count({ where }),
    prisma.timeOffType.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    data: types.map(mapTimeOffType),
    meta: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createTimeOffType(body: {
  name: string;
  code: string;
  unit: 'days' | 'hours';
  requiresAllocation?: boolean;
  isPaid?: boolean;
  approvalRole?: UserRole;
  color: string;
  active?: boolean;
}) {
  const company = await prisma.company.findFirst();
  if (!company) {
    throw ApiError.internal('No company found');
  }

  const existing = await prisma.timeOffType.findFirst({
    where: {
      OR: [{ name: body.name }, { code: body.code }],
    },
  });

  if (existing) {
    throw ApiError.conflict('A time off type with this name or code already exists');
  }

  const type = await prisma.timeOffType.create({
    data: {
      companyId: company.id,
      name: body.name,
      code: body.code.toUpperCase(),
      unit: body.unit,
      requiresAllocation: body.requiresAllocation ?? true,
      isPaid: body.isPaid ?? true,
      approvalRole: body.approvalRole ?? 'hr_manager',
      color: body.color,
      active: body.active ?? true,
    },
  });

  return mapTimeOffType(type);
}

export async function getTimeOffType(id: string) {
  const type = await prisma.timeOffType.findUnique({
    where: { id },
  });
  if (!type) {
    throw ApiError.notFound('Time off type not found');
  }
  return mapTimeOffType(type);
}

export async function updateTimeOffType(
  id: string,
  body: Partial<{
    name: string;
    unit: 'days' | 'hours';
    requiresAllocation: boolean;
    isPaid: boolean;
    approvalRole: UserRole;
    color: string;
    active: boolean;
  }>,
) {
  const type = await prisma.timeOffType.findUnique({
    where: { id },
  });
  if (!type) {
    throw ApiError.notFound('Time off type not found');
  }

  if (body.name && body.name !== type.name) {
    const existing = await prisma.timeOffType.findUnique({
      where: { name: body.name },
    });
    if (existing) {
      throw ApiError.conflict('A time off type with this name already exists');
    }
  }

  const updated = await prisma.timeOffType.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.unit !== undefined ? { unit: body.unit } : {}),
      ...(body.requiresAllocation !== undefined
        ? { requiresAllocation: body.requiresAllocation }
        : {}),
      ...(body.isPaid !== undefined ? { isPaid: body.isPaid } : {}),
      ...(body.approvalRole !== undefined ? { approvalRole: body.approvalRole } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
    },
  });

  return mapTimeOffType(updated);
}

// ============================================================================
// Time Off Allocations
// ============================================================================

export async function listAllocations(
  query: {
    page: number;
    pageSize: number;
    employeeId?: string;
    timeOffTypeId?: string;
    status?: AllocationStatus;
  },
  scopedEmployeeId?: string,
) {
  const employeeId = scopedEmployeeId ?? query.employeeId;
  const where: Prisma.TimeOffAllocationWhereInput = {};

  if (employeeId) {
    where.employeeId = employeeId;
  }
  if (query.timeOffTypeId) {
    where.timeOffTypeId = query.timeOffTypeId;
  }
  if (query.status) {
    where.status = query.status;
  }

  const { skip, take } = skipTake(query.page, query.pageSize);
  const [total, allocations] = await Promise.all([
    prisma.timeOffAllocation.count({ where }),
    prisma.timeOffAllocation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { include: { department: true } },
        timeOffType: true,
        approver: { include: { department: true } },
        requests: true,
      },
    }),
  ]);

  return {
    data: allocations.map((a) => mapAllocation(a)),
    meta: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createAllocation(body: {
  employeeId: string;
  timeOffTypeId: string;
  allocated: string;
  validFrom: string;
  validTo: string;
  description?: string | null;
}) {
  if (body.validTo < body.validFrom) {
    throw ApiError.validation('validTo must be on or after validFrom', [
      { field: 'validTo', message: 'must be on or after validFrom' },
    ]);
  }

  const [employee, type] = await Promise.all([
    prisma.employee.findUnique({ where: { id: body.employeeId } }),
    prisma.timeOffType.findUnique({ where: { id: body.timeOffTypeId } }),
  ]);

  if (!employee) throw ApiError.notFound('Employee not found');
  if (!type) throw ApiError.notFound('Time off type not found');

  const allocation = await prisma.timeOffAllocation.create({
    data: {
      employeeId: body.employeeId,
      timeOffTypeId: body.timeOffTypeId,
      allocated: new Prisma.Decimal(body.allocated),
      validFrom: new Date(`${body.validFrom}T00:00:00.000Z`),
      validTo: new Date(`${body.validTo}T00:00:00.000Z`),
      status: 'draft',
      description: body.description ?? null,
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  return mapAllocation(allocation);
}

export async function getAllocation(id: string, scopedEmployeeId?: string) {
  const allocation = await prisma.timeOffAllocation.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  if (!allocation) {
    throw ApiError.notFound('Allocation not found');
  }

  if (scopedEmployeeId && allocation.employeeId !== scopedEmployeeId) {
    throw ApiError.notFound('Allocation not found');
  }

  return mapAllocation(allocation);
}

export async function updateAllocation(
  id: string,
  body: Partial<{
    allocated: string;
    validFrom: string;
    validTo: string;
    description: string | null;
  }>,
) {
  const allocation = await prisma.timeOffAllocation.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  if (!allocation) {
    throw ApiError.notFound('Allocation not found');
  }

  if (allocation.status !== 'draft') {
    throw ApiError.conflict('Only draft allocations can be updated');
  }

  const validFrom = body.validFrom ?? toDateOnly(allocation.validFrom);
  const validTo = body.validTo ?? toDateOnly(allocation.validTo);
  if (validTo < validFrom) {
    throw ApiError.validation('validTo must be on or after validFrom', [
      { field: 'validTo', message: 'must be on or after validFrom' },
    ]);
  }

  const updated = await prisma.timeOffAllocation.update({
    where: { id },
    data: {
      ...(body.allocated !== undefined
        ? { allocated: new Prisma.Decimal(body.allocated) }
        : {}),
      ...(body.validFrom !== undefined
        ? { validFrom: new Date(`${body.validFrom}T00:00:00.000Z`) }
        : {}),
      ...(body.validTo !== undefined
        ? { validTo: new Date(`${body.validTo}T00:00:00.000Z`) }
        : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  return mapAllocation(updated);
}

export async function approveAllocation(id: string, approverEmployeeId?: string | null) {
  const allocation = await prisma.timeOffAllocation.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  if (!allocation) {
    throw ApiError.notFound('Allocation not found');
  }

  if (allocation.status !== 'draft') {
    throw ApiError.conflict('Only draft allocations can be approved');
  }

  const updated = await prisma.timeOffAllocation.update({
    where: { id },
    data: {
      status: 'approved',
      approverId: approverEmployeeId ?? null,
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  return mapAllocation(updated);
}

export async function refuseAllocation(id: string, approverEmployeeId?: string | null) {
  const allocation = await prisma.timeOffAllocation.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  if (!allocation) {
    throw ApiError.notFound('Allocation not found');
  }

  if (allocation.status === 'refused') {
    throw ApiError.conflict('Allocation is already refused');
  }

  const updated = await prisma.timeOffAllocation.update({
    where: { id },
    data: {
      status: 'refused',
      approverId: approverEmployeeId ?? null,
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      requests: true,
    },
  });

  return mapAllocation(updated);
}

// ============================================================================
// Time Off Requests
// ============================================================================

async function calculateRequestDuration(
  employeeId: string,
  type: { unit: string },
  startDate: string,
  endDate: string,
  durationType: TimeOffDurationType,
  requestedHours?: string | null,
) {
  if (endDate < startDate) {
    throw ApiError.validation('endDate must be on or after startDate', [
      { field: 'endDate', message: 'must be on or after startDate' },
    ]);
  }

  if (durationType === 'half_day' && startDate !== endDate) {
    throw ApiError.validation('Half-day requests must be for a single date', [
      { field: 'endDate', message: 'must match startDate for half_day requests' },
    ]);
  }

  if (durationType === 'hours') {
    if (type.unit !== 'hours') {
      throw ApiError.validation('Hours duration is only allowed for hour-unit time off types');
    }
    if (!requestedHours || Number(requestedHours) <= 0) {
      throw ApiError.validation('requestedHours must be greater than zero for hours duration', [
        { field: 'requestedHours', message: 'must be greater than 0' },
      ]);
    }
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      workingSchedule: {
        include: { days: true },
      },
    },
  });

  if (!employee) throw ApiError.notFound('Employee not found');

  const scheduleDays = employee.workingSchedule?.days ?? [];
  const scheduledWeekdays = new Set(scheduleDays.map((d) => d.dayOfWeek));

  const holidays = await prisma.publicHoliday.findMany({
    where: {
      date: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T00:00:00.000Z`),
      },
    },
  });
  const holidaySet = new Set(holidays.map((h) => toDateOnly(h.date)));

  const datesInRange = getDatesInRange(startDate, endDate);
  let workingDaysCount = 0;
  for (const d of datesInRange) {
    const weekday = getIsoWeekday(d);
    if (!holidaySet.has(d) && scheduledWeekdays.has(weekday)) {
      workingDaysCount++;
    }
  }

  let dailyHours = 8.0;
  if (
    employee.workingSchedule &&
    employee.workingSchedule.daysPerWeek > 0 &&
    Number(employee.workingSchedule.hoursPerWeek) > 0
  ) {
    dailyHours =
      Number(employee.workingSchedule.hoursPerWeek) / employee.workingSchedule.daysPerWeek;
  }

  let durationDays: string;
  let durationHours: string;

  if (durationType === 'half_day') {
    if (workingDaysCount === 0) {
      throw ApiError.validation('The selected date is not a scheduled working day');
    }
    durationDays = '0.50';
    const hours = requestedHours
      ? Number(requestedHours)
      : roundHalfUp(dailyHours / 2, 2).toNumber();
    durationHours = roundHalfUp(hours, 2).toFixed(2);
  } else if (durationType === 'hours') {
    durationHours = roundHalfUp(requestedHours!, 2).toFixed(2);
    durationDays = roundHalfUp(Number(requestedHours) / dailyHours, 2).toFixed(2);
  } else {
    // full_day
    if (workingDaysCount === 0) {
      throw ApiError.validation('No scheduled working days in the selected date range');
    }
    durationDays = roundHalfUp(workingDaysCount, 2).toFixed(2);
    durationHours = roundHalfUp(workingDaysCount * dailyHours, 2).toFixed(2);
  }

  return { durationDays, durationHours, dailyHours };
}

export async function listTimeOffRequests(
  query: {
    page: number;
    pageSize: number;
    employeeId?: string;
    timeOffTypeId?: string;
    status?: RequestStatus;
    dateFrom?: string;
    dateTo?: string;
  },
  scopedEmployeeId?: string,
) {
  const employeeId = scopedEmployeeId ?? query.employeeId;
  const where: Prisma.TimeOffRequestWhereInput = {};

  if (employeeId) {
    where.employeeId = employeeId;
  }
  if (query.timeOffTypeId) {
    where.timeOffTypeId = query.timeOffTypeId;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.dateFrom || query.dateTo) {
    where.startDate = {};
    if (query.dateFrom) {
      where.startDate.gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    }
    if (query.dateTo) {
      where.startDate.lte = new Date(`${query.dateTo}T00:00:00.000Z`);
    }
  }

  const { skip, take } = skipTake(query.page, query.pageSize);
  const [total, requests] = await Promise.all([
    prisma.timeOffRequest.count({ where }),
    prisma.timeOffRequest.findMany({
      where,
      skip,
      take,
      orderBy: { startDate: 'desc' },
      include: {
        employee: { include: { department: true } },
        timeOffType: true,
        approver: { include: { department: true } },
        allocation: {
          include: {
            employee: { include: { department: true } },
            timeOffType: true,
            approver: { include: { department: true } },
            requests: true,
          },
        },
      },
    }),
  ]);

  return {
    data: requests.map(mapRequest),
    meta: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createTimeOffRequest(body: {
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  durationType: TimeOffDurationType;
  requestedHours?: string | null;
  reason?: string | null;
}) {
  const type = await prisma.timeOffType.findUnique({
    where: { id: body.timeOffTypeId },
  });
  if (!type) throw ApiError.notFound('Time off type not found');

  const { durationDays, durationHours } = await calculateRequestDuration(
    body.employeeId,
    type,
    body.startDate,
    body.endDate,
    body.durationType,
    body.requestedHours,
  );

  const startT = new Date(`${body.startDate}T00:00:00.000Z`);
  const endT = new Date(`${body.endDate}T00:00:00.000Z`);

  const overlap = await prisma.timeOffRequest.findFirst({
    where: {
      employeeId: body.employeeId,
      status: { in: ['to_approve', 'approved'] },
      AND: [
        { startDate: { lte: endT } },
        { endDate: { gte: startT } },
      ],
    },
  });

  if (overlap) {
    throw ApiError.conflict('A request already exists for this time period');
  }

  let allocationId: string | null = null;
  if (type.requiresAllocation) {
    const allocation = await prisma.timeOffAllocation.findFirst({
      where: {
        employeeId: body.employeeId,
        timeOffTypeId: body.timeOffTypeId,
        status: 'approved',
        validFrom: { lte: new Date(`${body.startDate}T00:00:00.000Z`) },
        validTo: { gte: new Date(`${body.endDate}T00:00:00.000Z`) },
      },
      include: {
        requests: {
          where: { status: 'approved' },
        },
      },
    });

    if (!allocation) {
      throw ApiError.validation('No approved allocation covers this request period');
    }

    const isDays = type.unit === 'days';
    let currentTaken = 0;
    for (const r of allocation.requests) {
      currentTaken += Number(isDays ? r.durationDays : r.durationHours);
    }
    const allocated = Number(allocation.allocated);
    const needed = Number(isDays ? durationDays : durationHours);
    if (allocated - currentTaken < needed) {
      throw ApiError.validation('Request exceeds remaining allocation balance');
    }

    allocationId = allocation.id;
  }

  const created = await prisma.timeOffRequest.create({
    data: {
      employeeId: body.employeeId,
      timeOffTypeId: body.timeOffTypeId,
      allocationId,
      startDate: new Date(`${body.startDate}T00:00:00.000Z`),
      endDate: new Date(`${body.endDate}T00:00:00.000Z`),
      durationType: body.durationType,
      requestedHours: body.requestedHours ? new Prisma.Decimal(body.requestedHours) : null,
      durationDays: new Prisma.Decimal(durationDays),
      durationHours: new Prisma.Decimal(durationHours),
      status: 'to_approve',
      reason: body.reason ?? null,
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      allocation: {
        include: {
          employee: { include: { department: true } },
          timeOffType: true,
          approver: { include: { department: true } },
          requests: true,
        },
      },
    },
  });

  // Notify approvers (HR managers)
  const hrUsers = await prisma.user.findMany({
    where: {
      role: { in: ['hr_manager', 'hr_payroll_manager', 'admin'] },
      status: 'active',
    },
  });

  for (const u of hrUsers) {
    sendNotification(
      u.id,
      'time_off_requested',
      'Time off request pending',
      `${created.employee.firstName} ${created.employee.lastName} requested ${durationDays} days of ${type.name}`,
      `/time-off/requests/${created.id}`,
    );
  }

  return mapRequest(created);
}

export async function getTimeOffRequest(id: string, scopedEmployeeId?: string) {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      allocation: {
        include: {
          employee: { include: { department: true } },
          timeOffType: true,
          approver: { include: { department: true } },
          requests: true,
        },
      },
    },
  });

  if (!request) {
    throw ApiError.notFound('Time off request not found');
  }

  if (scopedEmployeeId && request.employeeId !== scopedEmployeeId) {
    throw ApiError.notFound('Time off request not found');
  }

  return mapRequest(request);
}

export async function updateTimeOffRequest(
  id: string,
  body: Partial<{
    startDate: string;
    endDate: string;
    durationType: TimeOffDurationType;
    requestedHours: string | null;
    reason: string | null;
    status: 'cancelled';
  }>,
  scopedEmployeeId?: string,
) {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      allocation: {
        include: {
          employee: { include: { department: true } },
          timeOffType: true,
          approver: { include: { department: true } },
          requests: true,
        },
      },
    },
  });

  if (!request) {
    throw ApiError.notFound('Time off request not found');
  }

  if (scopedEmployeeId && request.employeeId !== scopedEmployeeId) {
    throw ApiError.notFound('Time off request not found');
  }

  if (body.status === 'cancelled') {
    if (request.status !== 'to_approve') {
      throw ApiError.conflict('Only requests awaiting approval can be cancelled');
    }
    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        employee: { include: { department: true } },
        timeOffType: true,
        approver: { include: { department: true } },
        allocation: {
          include: {
            employee: { include: { department: true } },
            timeOffType: true,
            approver: { include: { department: true } },
            requests: true,
          },
        },
      },
    });
    return mapRequest(updated);
  }

  if (request.status !== 'to_approve') {
    throw ApiError.conflict('Only requests in to_approve status can be updated');
  }

  const startDate = body.startDate ?? toDateOnly(request.startDate);
  const endDate = body.endDate ?? toDateOnly(request.endDate);
  const durationType = body.durationType ?? (request.durationType as TimeOffDurationType);
  const requestedHours =
    body.requestedHours !== undefined
      ? body.requestedHours
      : request.requestedHours
        ? quantityString(request.requestedHours)
        : null;

  const { durationDays, durationHours } = await calculateRequestDuration(
    request.employeeId,
    request.timeOffType,
    startDate,
    endDate,
    durationType,
    requestedHours,
  );

  const startT = new Date(`${startDate}T00:00:00.000Z`);
  const endT = new Date(`${endDate}T00:00:00.000Z`);

  const overlap = await prisma.timeOffRequest.findFirst({
    where: {
      id: { not: id },
      employeeId: request.employeeId,
      status: { in: ['to_approve', 'approved'] },
      AND: [
        { startDate: { lte: endT } },
        { endDate: { gte: startT } },
      ],
    },
  });

  if (overlap) {
    throw ApiError.conflict('A request already exists for this time period');
  }

  let allocationId = request.allocationId;
  if (request.timeOffType.requiresAllocation) {
    const allocation = await prisma.timeOffAllocation.findFirst({
      where: {
        employeeId: request.employeeId,
        timeOffTypeId: request.timeOffTypeId,
        status: 'approved',
        validFrom: { lte: new Date(`${startDate}T00:00:00.000Z`) },
        validTo: { gte: new Date(`${endDate}T00:00:00.000Z`) },
      },
      include: {
        requests: {
          where: { status: 'approved' },
        },
      },
    });

    if (!allocation) {
      throw ApiError.validation('No approved allocation covers this request period');
    }

    const isDays = request.timeOffType.unit === 'days';
    let currentTaken = 0;
    for (const r of allocation.requests) {
      currentTaken += Number(isDays ? r.durationDays : r.durationHours);
    }
    const allocated = Number(allocation.allocated);
    const needed = Number(isDays ? durationDays : durationHours);
    if (allocated - currentTaken < needed) {
      throw ApiError.validation('Request exceeds remaining allocation balance');
    }

    allocationId = allocation.id;
  }

  const updated = await prisma.timeOffRequest.update({
    where: { id },
    data: {
      startDate: new Date(`${startDate}T00:00:00.000Z`),
      endDate: new Date(`${endDate}T00:00:00.000Z`),
      durationType,
      requestedHours: requestedHours ? new Prisma.Decimal(requestedHours) : null,
      durationDays: new Prisma.Decimal(durationDays),
      durationHours: new Prisma.Decimal(durationHours),
      allocationId,
      ...(body.reason !== undefined ? { reason: body.reason } : {}),
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      allocation: {
        include: {
          employee: { include: { department: true } },
          timeOffType: true,
          approver: { include: { department: true } },
          requests: true,
        },
      },
    },
  });

  return mapRequest(updated);
}

export async function approveTimeOffRequest(
  id: string,
  approverEmployeeId?: string | null,
) {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true, user: true } },
      timeOffType: true,
      allocation: {
        include: {
          requests: {
            where: { status: 'approved' },
          },
        },
      },
    },
  });

  if (!request) {
    throw ApiError.notFound('Time off request not found');
  }

  if (request.status !== 'to_approve') {
    throw ApiError.conflict('Only requests in to_approve status can be approved');
  }

  if (request.timeOffType.requiresAllocation && request.allocation) {
    const isDays = request.timeOffType.unit === 'days';
    let currentTaken = 0;
    for (const r of request.allocation.requests) {
      currentTaken += Number(isDays ? r.durationDays : r.durationHours);
    }
    const needed = Number(isDays ? request.durationDays : request.durationHours);
    const allocated = Number(request.allocation.allocated);
    if (allocated - currentTaken < needed) {
      throw ApiError.validation('Request exceeds remaining allocation balance');
    }
  }

  const updated = await prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: 'approved',
      approverId: approverEmployeeId ?? null,
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      allocation: {
        include: {
          employee: { include: { department: true } },
          timeOffType: true,
          approver: { include: { department: true } },
          requests: true,
        },
      },
    },
  });

  // Notify employee
  if (request.employee.user?.id) {
    sendNotification(
      request.employee.user.id,
      'time_off_approved',
      'Time off request approved',
      `Your request for ${quantityString(request.durationDays)} days of ${request.timeOffType.name} was approved`,
      `/time-off/requests/${request.id}`,
    );
  }

  return mapRequest(updated);
}

export async function refuseTimeOffRequest(
  id: string,
  refusalReason?: string | null,
  approverEmployeeId?: string | null,
) {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true, user: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      allocation: {
        include: {
          employee: { include: { department: true } },
          timeOffType: true,
          approver: { include: { department: true } },
          requests: true,
        },
      },
    },
  });

  if (!request) {
    throw ApiError.notFound('Time off request not found');
  }

  if (request.status !== 'to_approve' && request.status !== 'approved') {
    throw ApiError.conflict('Only to_approve or approved requests can be refused');
  }

  const updated = await prisma.timeOffRequest.update({
    where: { id },
    data: {
      status: 'refused',
      refusalReason: refusalReason ?? null,
      approverId: approverEmployeeId ?? null,
    },
    include: {
      employee: { include: { department: true } },
      timeOffType: true,
      approver: { include: { department: true } },
      allocation: {
        include: {
          employee: { include: { department: true } },
          timeOffType: true,
          approver: { include: { department: true } },
          requests: true,
        },
      },
    },
  });

  // Notify employee
  if (request.employee.user?.id) {
    sendNotification(
      request.employee.user.id,
      'time_off_refused',
      'Time off request refused',
      `Your request for ${quantityString(request.durationDays)} days of ${request.timeOffType.name} was refused`,
      `/time-off/requests/${request.id}`,
    );
  }

  return mapRequest(updated);
}

// ============================================================================
// Time Off Dashboard
// ============================================================================

export async function getTimeOffDashboard(
  queryEmployeeId?: string,
  queryYear?: number,
  scopedEmployeeId?: string,
  authEmployeeId?: string,
) {
  let employeeId = scopedEmployeeId ?? queryEmployeeId ?? authEmployeeId;
  if (!employeeId) {
    const firstEmp = await prisma.employee.findFirst({
      where: { status: 'active' },
      orderBy: { firstName: 'asc' },
    });
    if (!firstEmp) throw ApiError.notFound('No employee found');
    employeeId = firstEmp.id;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      department: true,
      workingSchedule: {
        include: { days: true },
      },
    },
  });

  if (!employee) throw ApiError.notFound('Employee not found');

  const year = queryYear ?? new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [types, holidays, approvedRequests, pendingRequests, allocations] = await Promise.all([
    prisma.timeOffType.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    }),
    prisma.publicHoliday.findMany({
      where: {
        date: {
          gte: new Date(`${yearStart}T00:00:00.000Z`),
          lte: new Date(`${yearEnd}T00:00:00.000Z`),
        },
      },
    }),
    prisma.timeOffRequest.findMany({
      where: {
        employeeId,
        status: 'approved',
        startDate: { lte: new Date(`${yearEnd}T00:00:00.000Z`) },
        endDate: { gte: new Date(`${yearStart}T00:00:00.000Z`) },
      },
      include: { timeOffType: true },
    }),
    prisma.timeOffRequest.findMany({
      where: {
        employeeId,
        status: 'to_approve',
        startDate: { lte: new Date(`${yearEnd}T00:00:00.000Z`) },
        endDate: { gte: new Date(`${yearStart}T00:00:00.000Z`) },
      },
      include: { timeOffType: true },
    }),
    prisma.timeOffAllocation.findMany({
      where: {
        employeeId,
        status: 'approved',
        validFrom: { lte: new Date(`${yearEnd}T00:00:00.000Z`) },
        validTo: { gte: new Date(`${yearStart}T00:00:00.000Z`) },
      },
    }),
  ]);

  const scheduleDays = employee.workingSchedule?.days ?? [];
  const scheduledWeekdays = new Set(scheduleDays.map((d) => d.dayOfWeek));
  const holidayMap = new Map<string, string>();
  for (const h of holidays) {
    holidayMap.set(toDateOnly(h.date), h.name);
  }

  // Build calendar days
  const allDates = getDatesInRange(yearStart, yearEnd);
  const days = allDates.map((dateStr) => {
    // 1. Holiday
    const holidayName = holidayMap.get(dateStr);
    if (holidayName) {
      return {
        date: dateStr,
        kind: 'holiday' as const,
        timeOffTypeId: null,
        color: null,
        fraction: '1.00',
        label: holidayName,
      };
    }

    // 2. Non-working day
    const weekday = getIsoWeekday(dateStr);
    if (!scheduledWeekdays.has(weekday)) {
      return {
        date: dateStr,
        kind: 'non_working' as const,
        timeOffTypeId: null,
        color: null,
        fraction: '0.00',
        label: null,
      };
    }

    // 3. Leave check
    const matchedRequest = approvedRequests.find(
      (r) => dateStr >= toDateOnly(r.startDate) && dateStr <= toDateOnly(r.endDate),
    );
    if (matchedRequest) {
      const isHalfDay = matchedRequest.durationType === 'half_day';
      return {
        date: dateStr,
        kind: 'leave' as const,
        timeOffTypeId: matchedRequest.timeOffTypeId,
        color: matchedRequest.timeOffType.color,
        fraction: isHalfDay ? '0.50' : '1.00',
        label: matchedRequest.timeOffType.name,
      };
    }

    const matchedPending = pendingRequests.find(
      (r) => dateStr >= toDateOnly(r.startDate) && dateStr <= toDateOnly(r.endDate),
    );
    if (matchedPending) {
      const isHalfDay = matchedPending.durationType === 'half_day';
      return {
        date: dateStr,
        kind: 'leave' as const,
        timeOffTypeId: matchedPending.timeOffTypeId,
        color: matchedPending.timeOffType.color,
        fraction: isHalfDay ? '0.50' : '1.00',
        label: `${matchedPending.timeOffType.name} (Pending)`,
        isPending: true,
      };
    }

    // 4. Working day
    return {
      date: dateStr,
      kind: 'working' as const,
      timeOffTypeId: null,
      color: null,
      fraction: '1.00',
      label: null,
    };
  });

  // Build entitlements
  const entitlements = types.map((t) => {
    const typeAllocations = allocations.filter((a) => a.timeOffTypeId === t.id);
    const typeApproved = approvedRequests.filter((r) => r.timeOffTypeId === t.id);
    const typePending = pendingRequests.filter((r) => r.timeOffTypeId === t.id);

    const isDays = t.unit === 'days';
    let allocatedTotal = 0;
    for (const a of typeAllocations) {
      allocatedTotal += Number(a.allocated);
    }
    let takenTotal = 0;
    for (const r of typeApproved) {
      takenTotal += Number(isDays ? r.durationDays : r.durationHours);
    }
    let pendingTotal = 0;
    for (const r of typePending) {
      pendingTotal += Number(isDays ? r.durationDays : r.durationHours);
    }

    const remainingTotal = Math.max(0, allocatedTotal - takenTotal);

    return {
      timeOffType: mapTimeOffTypeRef(t),
      allocated: quantityString(roundHalfUp(allocatedTotal, 2)),
      taken: quantityString(roundHalfUp(takenTotal, 2)),
      remaining: quantityString(roundHalfUp(remainingTotal, 2)),
      pending: quantityString(roundHalfUp(pendingTotal, 2)),
    };
  });

  return {
    employee: mapEmployeeRef(employee),
    year,
    workingSchedule: employee.workingSchedule
      ? {
          id: employee.workingSchedule.id,
          name: employee.workingSchedule.name,
          hoursPerWeek: quantityString(employee.workingSchedule.hoursPerWeek),
          workingHoursPerDay: employee.workingSchedule.days?.[0]?.hours
            ? quantityString(employee.workingSchedule.days[0].hours)
            : '8.00',
          breakPolicy: '1 hour unpaid lunch',
          days: (employee.workingSchedule.days ?? []).map((d) => ({
            dayOfWeek: d.dayOfWeek,
            dayType: 'working',
          })),
        }
      : {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Standard 40h',
          hoursPerWeek: '40.00',
          workingHoursPerDay: '8.00',
          breakPolicy: '1 hour unpaid lunch',
          days: [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, dayType: 'working' })),
        },
    days,
    entitlements,
  };
}
