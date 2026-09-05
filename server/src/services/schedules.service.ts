import { Prisma } from '@prisma/client';
import { prisma } from '../db/client.js';
import { ApiError } from '../lib/apiError.js';
import { paginationMeta } from '../lib/pagination.js';

function mapSchedule(s: {
  id: string;
  name: string;
  timezone: string;
  daysPerWeek: number;
  hoursPerWeek: Prisma.Decimal;
  active: boolean;
  _count?: { employees: number };
  days: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakHours: Prisma.Decimal;
    hours: Prisma.Decimal;
  }[];
}) {
  return {
    id: s.id,
    name: s.name,
    timezone: s.timezone,
    daysPerWeek: s.daysPerWeek,
    hoursPerWeek: s.hoursPerWeek.toString(),
    active: s.active,
    employeeCount: s._count?.employees ?? 0,
    days: s.days.map((d) => ({
      id: d.id,
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      breakHours: d.breakHours.toString(),
      hours: d.hours.toString(),
    })),
  };
}

export async function listWorkingSchedules(query: { page?: number; pageSize?: number }) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  let [total, rows] = await Promise.all([
    prisma.workingSchedule.count(),
    prisma.workingSchedule.findMany({
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
      include: {
        days: { orderBy: { dayOfWeek: 'asc' } },
        _count: { select: { employees: true } },
      },
    }),
  ]);

  if (total === 0) {
    const company = await prisma.company.findFirst();
    if (company) {
      const created = await prisma.workingSchedule.create({
        data: {
          companyId: company.id,
          name: 'Standard 40h',
          timezone: company.timezone || 'Asia/Kolkata',
          daysPerWeek: 5,
          hoursPerWeek: new Prisma.Decimal('40.00'),
          active: true,
          days: {
            create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
              dayOfWeek,
              startTime: '09:00',
              endTime: '18:00',
              breakHours: new Prisma.Decimal('1.00'),
              hours: new Prisma.Decimal('8.00'),
            })),
          },
        },
        include: {
          days: { orderBy: { dayOfWeek: 'asc' } },
          _count: { select: { employees: true } },
        },
      });
      rows = [created];
      total = 1;
    }
  }

  return {
    data: rows.map(mapSchedule),
    meta: paginationMeta(page, pageSize, total),
  };
}

export async function createWorkingSchedule(body: {
  name: string;
  active?: boolean;
  days: { dayOfWeek: number; startTime: string; endTime: string; breakHours?: string }[];
}) {
  const company = await prisma.company.findFirst();
  if (!company) throw ApiError.internal('Company not configured');

  const existing = await prisma.workingSchedule.findUnique({ where: { name: body.name } });
  if (existing) {
    throw ApiError.conflict(`Working schedule "${body.name}" already exists`);
  }

  let totalWeeklyHours = 0;
  const dayData = body.days.map((d) => {
    const bHours = parseFloat(d.breakHours ?? '1.00');
    const startH = parseInt((d.startTime || '09:00').split(':')[0] || '9', 10);
    const endH = parseInt((d.endTime || '18:00').split(':')[0] || '18', 10);
    const dayHours = Math.max(0, endH - startH - bHours);
    totalWeeklyHours += dayHours;
    return {
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      breakHours: new Prisma.Decimal(d.breakHours ?? '1.00'),
      hours: new Prisma.Decimal(dayHours.toFixed(2)),
    };
  });

  const created = await prisma.workingSchedule.create({
    data: {
      companyId: company.id,
      name: body.name,
      timezone: company.timezone || 'Asia/Kolkata',
      daysPerWeek: dayData.length,
      hoursPerWeek: new Prisma.Decimal(totalWeeklyHours.toFixed(2)),
      active: body.active ?? true,
      days: {
        create: dayData,
      },
    },
    include: {
      days: { orderBy: { dayOfWeek: 'asc' } },
      _count: { select: { employees: true } },
    },
  });

  return mapSchedule(created);
}

export async function getWorkingSchedule(id: string) {
  const s = await prisma.workingSchedule.findUnique({
    where: { id },
    include: {
      days: { orderBy: { dayOfWeek: 'asc' } },
      _count: { select: { employees: true } },
    },
  });

  if (!s) throw ApiError.notFound('Working schedule not found');
  return mapSchedule(s);
}

export async function updateWorkingSchedule(
  id: string,
  body: {
    name?: string;
    active?: boolean;
    days?: { dayOfWeek: number; startTime: string; endTime: string; breakHours?: string }[];
  },
) {
  const current = await prisma.workingSchedule.findUnique({ where: { id } });
  if (!current) throw ApiError.notFound('Working schedule not found');

  if (body.name && body.name !== current.name) {
    const existing = await prisma.workingSchedule.findUnique({ where: { name: body.name } });
    if (existing) {
      throw ApiError.conflict(`Working schedule "${body.name}" already exists`);
    }
  }

  const updated = await prisma.workingSchedule.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
    },
    include: {
      days: { orderBy: { dayOfWeek: 'asc' } },
      _count: { select: { employees: true } },
    },
  });

  return mapSchedule(updated);
}

export async function listPublicHolidays(query: { year?: number }) {
  const year = query.year ?? new Date().getFullYear();
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const rows = await prisma.publicHoliday.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  return rows.map((h) => ({
    id: h.id,
    name: h.name,
    date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : String(h.date),
  }));
}

export async function createPublicHoliday(body: { name: string; date: string }) {
  const company = await prisma.company.findFirst();
  if (!company) throw ApiError.internal('Company not configured');

  const todayStr = new Date().toISOString().slice(0, 10);
  if (body.date < todayStr) {
    throw ApiError.validation('Public holiday date cannot be in the past');
  }

  const holidayDate = new Date(`${body.date}T00:00:00.000Z`);

  const existing = await prisma.publicHoliday.findFirst({
    where: {
      companyId: company.id,
      date: holidayDate,
    },
  });
  if (existing) {
    throw ApiError.conflict('A public holiday for this date already exists');
  }

  try {
    const created = await prisma.publicHoliday.create({
      data: {
        companyId: company.id,
        name: body.name,
        date: holidayDate,
      },
    });

    return {
      id: created.id,
      name: created.name,
      date: created.date instanceof Date ? created.date.toISOString().split('T')[0] : String(created.date),
    };
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict('A public holiday for this date already exists');
    }
    throw err;
  }
}

export async function deletePublicHoliday(id: string) {
  const current = await prisma.publicHoliday.findUnique({ where: { id } });
  if (!current) throw ApiError.notFound('Public holiday not found');
  await prisma.publicHoliday.delete({ where: { id } });
}
