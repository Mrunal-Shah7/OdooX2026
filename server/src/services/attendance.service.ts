import { paginationMeta } from '../lib/pagination.js';

const stubEmployeeRef = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Priya',
  lastName: 'Sharma',
  workEmail: 'priya.sharma@peoplepay360.com',
  jobPosition: 'Software Engineer',
  departmentName: 'Engineering',
};

const stubAttendance = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  employee: stubEmployeeRef,
  date: '2026-01-15',
  checkIn: '2026-01-15T03:30:00.000Z',
  checkOut: null,
  workedHours: '4.50',
  overtimeHours: '0.00',
  status: 'present' as const,
  notes: null,
  isManualEdit: false,
};

export async function listAttendance(query: { page: number; pageSize: number }) {
  // TODO: STUB
  return {
    data: [stubAttendance],
    meta: paginationMeta(query.page, query.pageSize, 1),
  };
}

export async function createAttendance(body: {
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  overtimeHours?: string;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';
  notes?: string | null;
}) {
  // TODO: STUB
  return {
    ...stubAttendance,
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    date: body.date,
    checkIn: body.checkIn ?? null,
    checkOut: body.checkOut ?? null,
    overtimeHours: body.overtimeHours ?? '0.00',
    status: body.status,
    notes: body.notes ?? null,
    isManualEdit: true,
  };
}

export async function getActiveAttendance(_employeeId: string) {
  // TODO: STUB
  return {
    checkedIn: true,
    record: stubAttendance,
    todayWorkedHours: '4.50',
  };
}

export async function checkIn(_employeeId: string) {
  // TODO: STUB
  return stubAttendance;
}

export async function checkOut(_employeeId: string) {
  // TODO: STUB
  return {
    ...stubAttendance,
    checkOut: '2026-01-15T12:30:00.000Z',
    workedHours: '8.00',
  };
}

export async function getAttendance(id: string) {
  // TODO: STUB
  return { ...stubAttendance, id };
}

export async function updateAttendance(
  id: string,
  body: Partial<{
    checkIn: string | null;
    checkOut: string | null;
    overtimeHours: string;
    status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';
    notes: string | null;
  }>,
) {
  // TODO: STUB
  return {
    ...stubAttendance,
    id,
    ...(body.checkIn !== undefined ? { checkIn: body.checkIn } : {}),
    ...(body.checkOut !== undefined ? { checkOut: body.checkOut } : {}),
    ...(body.overtimeHours !== undefined ? { overtimeHours: body.overtimeHours } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    isManualEdit: true,
  };
}
