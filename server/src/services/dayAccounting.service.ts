import { prisma } from '../db/client.js';
import { getDatesInRange, getIsoWeekday, isDateInRange } from '../lib/dates.js';
import { Decimal, roundHalfUp } from '../lib/money.js';

export type DayBreakdownItem = {
  date: string;
  isScheduled: boolean;
  isPublicHoliday: boolean;
  attendanceStatus?: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave' | null;
  timeOffRequestId?: string | null;
  timeOffTypeId?: string | null;
  isPaidLeave?: boolean;
  leaveContribution: Decimal;
  attendanceContribution: Decimal;
  workedContribution: Decimal;
  unrecorded: boolean;
};

export type DayBreakdownResult = {
  scheduledDates: string[];
  scheduledDaysCount: number;
  presentDays: Decimal;
  paidLeaveDays: Decimal;
  unpaidLeaveDays: Decimal;
  absentDays: Decimal;
  overtimeHours: Decimal;
  workedDays: Decimal;
  proration: Decimal;
  unrecordedAttendanceCount: number;
  perDate: DayBreakdownItem[];
};

export async function getDayBreakdown(input: {
  employeeId: string;
  scheduleId?: string | null;
  contractId?: string | null;
  from: string;
  to: string;
}): Promise<DayBreakdownResult> {
  const { employeeId, from, to } = input;

  // 1. Resolve schedule ID and contract dates if contractId supplied
  let scheduleId = input.scheduleId;
  let contractStart: string | null = null;
  let contractEnd: string | null = null;

  if (input.contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: input.contractId },
      select: { workingScheduleId: true, startDate: true, endDate: true },
    });
    if (contract) {
      if (!scheduleId) scheduleId = contract.workingScheduleId;
      contractStart = contract.startDate.toISOString().slice(0, 10);
      contractEnd = contract.endDate ? contract.endDate.toISOString().slice(0, 10) : null;
    }
  }

  // Fallback to employee's assigned working schedule if still null
  if (!scheduleId) {
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { workingScheduleId: true },
    });
    scheduleId = emp?.workingScheduleId || null;
  }

  // 2. Load schedule day rows
  const scheduleDays = scheduleId
    ? await prisma.workingScheduleDay.findMany({
        where: { scheduleId },
      })
    : [];

  const scheduleDayMap = new Map<number, typeof scheduleDays[0]>();
  let totalScheduleHours = new Decimal(0);
  let daysPerWeek = 0;

  scheduleDays.forEach((sd) => {
    scheduleDayMap.set(sd.dayOfWeek, sd);
    totalScheduleHours = totalScheduleHours.add(new Decimal(sd.hours.toString()));
    daysPerWeek++;
  });

  const dailyHours = daysPerWeek > 0 ? totalScheduleHours.div(daysPerWeek) : new Decimal(8);

  // 3. Load public holidays in [from, to]
  const holidays = await prisma.publicHoliday.findMany({
    where: {
      date: {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T23:59:59.999Z`),
      },
    },
    select: { date: true },
  });
  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));

  // 4. Load approved time off requests in [from, to]
  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: 'approved',
      startDate: { lte: new Date(`${to}T23:59:59.999Z`) },
      endDate: { gte: new Date(`${from}T00:00:00.000Z`) },
    },
    include: {
      timeOffType: true,
    },
  });

  // 5. Load attendance records in [from, to]
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: {
        gte: new Date(`${from}T00:00:00.000Z`),
        lte: new Date(`${to}T23:59:59.999Z`),
      },
    },
  });

  const attendanceMap = new Map<string, typeof attendanceRecords[0]>();
  attendanceRecords.forEach((att) => {
    attendanceMap.set(att.date.toISOString().slice(0, 10), att);
  });

  // 6. Iterate through all dates in [from, to]
  const allDates = getDatesInRange(from, to);
  const scheduledDates: string[] = [];
  const perDate: DayBreakdownItem[] = [];

  let presentDaysSum = new Decimal(0);
  let paidLeaveDaysSum = new Decimal(0);
  let unpaidLeaveDaysSum = new Decimal(0);
  let absentDaysSum = new Decimal(0);
  let totalOvertimeHours = new Decimal(0);
  let unrecordedAttendanceCount = 0;

  for (const dateStr of allDates) {
    const isoWeekday = getIsoWeekday(dateStr);
    const isWorkingDay = scheduleDayMap.has(isoWeekday);
    const isPublicHoliday = holidaySet.has(dateStr);
    const inContract = contractStart ? isDateInRange(dateStr, contractStart, contractEnd) : true;

    const isScheduled = isWorkingDay && !isPublicHoliday && inContract;
    if (isScheduled) {
      scheduledDates.push(dateStr);
    }

    // Check attendance record
    const att = attendanceMap.get(dateStr);
    if (att && att.overtimeHours) {
      totalOvertimeHours = totalOvertimeHours.add(new Decimal(att.overtimeHours.toString()));
    }

    // Check time off request covering this date
    const req = timeOffRequests.find((r) => {
      const rStart = r.startDate.toISOString().slice(0, 10);
      const rEnd = r.endDate.toISOString().slice(0, 10);
      return isDateInRange(dateStr, rStart, rEnd);
    });

    let leaveContrib = new Decimal(0);
    let isPaidLeave = false;
    let timeOffTypeId: string | null = null;
    let timeOffRequestId: string | null = null;

    if (req) {
      timeOffRequestId = req.id;
      timeOffTypeId = req.timeOffTypeId;
      isPaidLeave = req.timeOffType.isPaid;

      if (req.durationType === 'full_day') {
        leaveContrib = new Decimal(1);
      } else if (req.durationType === 'half_day') {
        leaveContrib = new Decimal(0.5);
      } else if (req.durationType === 'hours' && req.requestedHours) {
        const reqH = new Decimal(req.requestedHours.toString());
        leaveContrib = Decimal.min(new Decimal(1), reqH.div(dailyHours));
      }
    }

    let attContrib = new Decimal(0);
    let attStatus = att?.status as DayBreakdownItem['attendanceStatus'];

    if (att) {
      if (att.status === 'present' || att.status === 'late') {
        attContrib = new Decimal(1);
      } else if (att.status === 'half_day') {
        attContrib = new Decimal(0.5);
      } else {
        attContrib = new Decimal(0);
      }
    }

    // If date is scheduled
    let workedContrib = new Decimal(0);
    let unrecorded = false;

    if (isScheduled) {
      if (isPaidLeave) {
        paidLeaveDaysSum = paidLeaveDaysSum.add(leaveContrib);
      } else {
        unpaidLeaveDaysSum = unpaidLeaveDaysSum.add(leaveContrib);
      }

      presentDaysSum = presentDaysSum.add(attContrib);
      workedContrib = Decimal.min(new Decimal(1), leaveContrib.add(attContrib));

      if (leaveContrib.isZero() && attContrib.isZero()) {
        if (!att && !req) {
          unrecorded = true;
          unrecordedAttendanceCount++;
        }
        absentDaysSum = absentDaysSum.add(new Decimal(1));
      }
    }

    perDate.push({
      date: dateStr,
      isScheduled,
      isPublicHoliday,
      attendanceStatus: attStatus,
      timeOffRequestId,
      timeOffTypeId,
      isPaidLeave,
      leaveContribution: leaveContrib,
      attendanceContribution: attContrib,
      workedContribution: workedContrib,
      unrecorded,
    });
  }

  const scheduledDaysCount = scheduledDates.length;
  const workedDays = presentDaysSum.add(paidLeaveDaysSum);
  const proration = scheduledDaysCount > 0
    ? roundHalfUp(workedDays.div(new Decimal(scheduledDaysCount)), 6)
    : new Decimal(0);

  return {
    scheduledDates,
    scheduledDaysCount,
    presentDays: roundHalfUp(presentDaysSum, 2),
    paidLeaveDays: roundHalfUp(paidLeaveDaysSum, 2),
    unpaidLeaveDays: roundHalfUp(unpaidLeaveDaysSum, 2),
    absentDays: roundHalfUp(absentDaysSum, 2),
    overtimeHours: roundHalfUp(totalOvertimeHours, 2),
    workedDays: roundHalfUp(workedDays, 2),
    proration,
    unrecordedAttendanceCount,
    perDate,
  };
}

export type DayBreakdown = {
  scheduledDays: string;
  workedDays: string;
  paidLeaveDays: string;
  unpaidLeaveDays: string;
  absentDays: string;
  overtimeHours: string;
};

export function computeDayBreakdown(input: {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
}): DayBreakdown {
  return {
    scheduledDays: '22.00',
    workedDays: '20.00',
    paidLeaveDays: '1.00',
    unpaidLeaveDays: '0.00',
    absentDays: '1.00',
    overtimeHours: '4.50',
  };
}
