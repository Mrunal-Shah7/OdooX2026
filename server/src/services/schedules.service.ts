import { paginationMeta } from '../lib/pagination.js';

const stubSchedule = {
  id: '66666666-6666-4666-8666-666666666666',
  name: 'Standard 40h',
  timezone: 'Asia/Kolkata',
  daysPerWeek: 5,
  hoursPerWeek: '40.00',
  active: true,
  employeeCount: 12,
  days: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
      breakHours: '1.00',
      hours: '8.00',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '18:00',
      breakHours: '1.00',
      hours: '8.00',
    },
  ],
};

const stubHoliday = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  name: 'Republic Day',
  date: '2026-01-26',
};

export async function listWorkingSchedules(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubSchedule],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createWorkingSchedule(body: {
  name: string;
  active?: boolean;
  days: { dayOfWeek: number; startTime: string; endTime: string; breakHours?: string }[];
}) {
  // TODO: STUB
  return {
    ...stubSchedule,
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    name: body.name,
    active: body.active ?? true,
    days: body.days.map((d, i) => ({
      id: `eeeeeeee-eeee-4eee-8eee-${String(i).padStart(12, '0')}`,
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      breakHours: d.breakHours ?? '1.00',
      hours: '8.00',
    })),
  };
}

export async function getWorkingSchedule(id: string) {
  // TODO: STUB
  return { ...stubSchedule, id };
}

export async function updateWorkingSchedule(
  id: string,
  body: {
    name?: string;
    active?: boolean;
    days?: { dayOfWeek: number; startTime: string; endTime: string; breakHours?: string }[];
  },
) {
  // TODO: STUB
  return {
    ...stubSchedule,
    id,
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.active !== undefined ? { active: body.active } : {}),
    ...(body.days !== undefined
      ? {
          days: body.days.map((d, i) => ({
            id: `eeeeeeee-eeee-4eee-8eee-${String(i).padStart(12, '0')}`,
            dayOfWeek: d.dayOfWeek,
            startTime: d.startTime,
            endTime: d.endTime,
            breakHours: d.breakHours ?? '1.00',
            hours: '8.00',
          })),
        }
      : {}),
  };
}

export async function listPublicHolidays(_query: { year?: number }) {
  // TODO: STUB
  return [stubHoliday];
}

export async function createPublicHoliday(body: { name: string; date: string }) {
  // TODO: STUB
  return {
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    name: body.name,
    date: body.date,
  };
}

export async function deletePublicHoliday(_id: string) {
  // TODO: STUB
}
