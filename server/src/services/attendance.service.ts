import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { getIsoWeekday, toDateOnly } from '../lib/dates.js';
import { quantityString, roundHalfUp } from '../lib/money.js';
import { paginationMeta, skipTake } from '../lib/pagination.js';
import type { AttendanceStatus } from '../../../shared/constants.js';

type AttendanceRecordWithEmployee = Prisma.AttendanceRecordGetPayload<{
  include: {
    employee: {
      include: {
        department: true;
      };
    };
  };
}>;

function mapAttendanceRecord(record: AttendanceRecordWithEmployee) {
  return {
    id: record.id,
    employee: {
      id: record.employee.id,
      firstName: record.employee.firstName,
      lastName: record.employee.lastName,
      workEmail: record.employee.workEmail,
      jobPosition: record.employee.jobPosition,
      departmentName: record.employee.department.name,
    },
    date: toDateOnly(record.date),
    checkIn: record.checkIn ? record.checkIn.toISOString() : null,
    checkOut: record.checkOut ? record.checkOut.toISOString() : null,
    workedHours: quantityString(record.workedHours),
    overtimeHours: quantityString(record.overtimeHours),
    status: record.status as AttendanceStatus,
    notes: record.notes,
    isManualEdit: record.isManualEdit,
  };
}

function getTodayDateStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getTimeStr(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export async function listAttendance(
  query: {
    page: number;
    pageSize: number;
    employeeId?: string;
    departmentId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: AttendanceStatus;
  },
  scopedEmployeeId?: string,
) {
  const employeeId = scopedEmployeeId ?? query.employeeId;
  const where: Prisma.AttendanceRecordWhereInput = {};

  if (employeeId) {
    where.employeeId = employeeId;
  }
  if (query.departmentId) {
    where.employee = { departmentId: query.departmentId };
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.dateFrom || query.dateTo) {
    where.date = {};
    if (query.dateFrom) {
      where.date.gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    }
    if (query.dateTo) {
      where.date.lte = new Date(`${query.dateTo}T00:00:00.000Z`);
    }
  }

  const { skip, take } = skipTake(query.page, query.pageSize);
  const [total, records] = await Promise.all([
    prisma.attendanceRecord.count({ where }),
    prisma.attendanceRecord.findMany({
      where,
      skip,
      take,
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
      include: {
        employee: {
          include: { department: true },
        },
      },
    }),
  ]);

  return {
    data: records.map(mapAttendanceRecord),
    meta: paginationMeta(query.page, query.pageSize, total),
  };
}

export async function createAttendance(body: {
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  overtimeHours?: string;
  status: AttendanceStatus;
  notes?: string | null;
}) {
  const recordDate = new Date(`${body.date}T00:00:00.000Z`);
  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId: body.employeeId,
        date: recordDate,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict('An attendance record already exists for this employee on this date');
  }

  const checkIn = body.checkIn ? new Date(body.checkIn) : null;
  const checkOut = body.checkOut ? new Date(body.checkOut) : null;
  let workedHours = '0.00';
  if (checkIn && checkOut) {
    const ms = Math.max(0, checkOut.getTime() - checkIn.getTime());
    workedHours = roundHalfUp(ms / (1000 * 60 * 60), 2).toFixed(2);
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId: body.employeeId,
      date: recordDate,
      checkIn,
      checkOut,
      workedHours,
      overtimeHours: body.overtimeHours ?? '0.00',
      status: body.status,
      notes: body.notes ?? null,
      isManualEdit: true,
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  return mapAttendanceRecord(record);
}

export async function getActiveAttendance(employeeId: string) {
  const todayStr = getTodayDateStr();
  const record = await prisma.attendanceRecord.findFirst({
    where: {
      employeeId,
      date: new Date(`${todayStr}T00:00:00.000Z`),
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  if (record && record.checkIn && !record.checkOut) {
    const ms = Math.max(0, Date.now() - record.checkIn.getTime());
    const hours = ms / (1000 * 60 * 60);
    return {
      checkedIn: true,
      record: mapAttendanceRecord(record),
      todayWorkedHours: quantityString(roundHalfUp(hours, 2)),
    };
  }

  if (record && record.checkOut) {
    return {
      checkedIn: false,
      record: mapAttendanceRecord(record),
      todayWorkedHours: quantityString(record.workedHours),
    };
  }

  return {
    checkedIn: false,
    record: null,
    todayWorkedHours: '0.00',
  };
}

export async function checkIn(employeeId: string) {
  const todayStr = getTodayDateStr();
  const recordDate = new Date(`${todayStr}T00:00:00.000Z`);

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: recordDate,
      },
    },
  });

  if (existing) {
    if (!existing.checkOut) {
      throw ApiError.conflict('Already checked in today');
    }
    throw ApiError.conflict('Attendance session already completed for today');
  }

  const weekday = getIsoWeekday(todayStr);
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      workingSchedule: {
        include: {
          days: {
            where: { dayOfWeek: weekday },
          },
        },
      },
    },
  });

  if (!employee) {
    throw ApiError.notFound('Employee not found');
  }

  const now = new Date();
  const nowTimeStr = getTimeStr(now);
  const dayRow = employee.workingSchedule?.days[0];

  let status: AttendanceStatus = 'present';
  if (dayRow && nowTimeStr > dayRow.startTime) {
    status = 'late';
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId,
      date: recordDate,
      checkIn: now,
      checkOut: null,
      workedHours: '0.00',
      overtimeHours: '0.00',
      status,
      isManualEdit: false,
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  return mapAttendanceRecord(record);
}

export async function checkOut(employeeId: string) {
  const todayStr = getTodayDateStr();
  const recordDate = new Date(`${todayStr}T00:00:00.000Z`);

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: recordDate,
      },
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  if (!record || !record.checkIn || record.checkOut) {
    throw ApiError.conflict('No open check-in session for today');
  }

  const now = new Date();
  const ms = Math.max(0, now.getTime() - record.checkIn.getTime());
  const hours = ms / (1000 * 60 * 60);
  const workedHours = roundHalfUp(hours, 2).toFixed(2);

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOut: now,
      workedHours,
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  return mapAttendanceRecord(updated);
}

export async function getAttendance(id: string, scopedEmployeeId?: string) {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  if (!record) {
    throw ApiError.notFound('Attendance record not found');
  }

  if (scopedEmployeeId && record.employeeId !== scopedEmployeeId) {
    throw ApiError.notFound('Attendance record not found');
  }

  return mapAttendanceRecord(record);
}

export async function updateAttendance(
  id: string,
  body: {
    checkIn?: string | null;
    checkOut?: string | null;
    overtimeHours?: string;
    status?: AttendanceStatus;
    notes?: string | null;
  },
) {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  if (!record) {
    throw ApiError.notFound('Attendance record not found');
  }

  const newCheckIn =
    body.checkIn !== undefined ? (body.checkIn ? new Date(body.checkIn) : null) : record.checkIn;
  const newCheckOut =
    body.checkOut !== undefined ? (body.checkOut ? new Date(body.checkOut) : null) : record.checkOut;

  let newWorkedHours = record.workedHours;
  if (newCheckIn && newCheckOut) {
    const ms = Math.max(0, newCheckOut.getTime() - newCheckIn.getTime());
    newWorkedHours = roundHalfUp(ms / (1000 * 60 * 60), 2);
  } else if (body.checkIn !== undefined || body.checkOut !== undefined) {
    if (!newCheckIn || !newCheckOut) {
      newWorkedHours = roundHalfUp(0, 2);
    }
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id },
    data: {
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      workedHours: newWorkedHours,
      ...(body.overtimeHours !== undefined ? { overtimeHours: body.overtimeHours } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      isManualEdit: true,
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
  });

  return mapAttendanceRecord(updated);
}
