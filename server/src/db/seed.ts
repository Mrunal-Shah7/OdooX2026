import { Prisma } from '@prisma/client';
import { prisma } from './client.js';
import { hashPassword } from '../lib/password.js';

const SEED_DATE = '2026-09-05';
const DEMO_PASSWORD = 'Demo@1234';
const TARGET_EMPLOYEES = 200;

const USER_IDS = {
  admin: 'a0000000-0000-4000-8000-000000000001',
  admin_dev: 'a0000000-0000-4000-8000-000000000006',
  hr_manager: 'a0000000-0000-4000-8000-000000000002',
  hr_payroll_user: 'a0000000-0000-4000-8000-000000000003',
  hr_payroll_manager: 'a0000000-0000-4000-8000-000000000004',
  employee: 'a0000000-0000-4000-8000-000000000005',
} as const;

const AARAV_EMPLOYEE_ID = 'e0000000-0000-4000-8000-000000000001';

const HOLIDAYS_2026: { name: string; date: string }[] = [
  { name: 'Republic Day', date: '2026-01-26' },
  { name: 'Holi', date: '2026-03-04' },
  { name: 'Id-ul-Fitr', date: '2026-03-21' },
  { name: 'Ram Navami', date: '2026-03-26' },
  { name: 'Mahavir Jayanti', date: '2026-03-31' },
  { name: 'Good Friday', date: '2026-04-03' },
  { name: 'Buddha Purnima', date: '2026-05-01' },
  { name: 'Id-ul-Zuha (Bakrid)', date: '2026-05-27' },
  { name: 'Muharram', date: '2026-06-26' },
  { name: 'Independence Day', date: '2026-08-15' },
  { name: "Milad-un-Nabi (Prophet's Birthday)", date: '2026-08-26' },
  { name: 'Janmashtami', date: '2026-09-04' },
  { name: "Mahatma Gandhi's Birthday", date: '2026-10-02' },
  { name: 'Dussehra (Vijay Dashmi)', date: '2026-10-20' },
  { name: 'Diwali (Deepavali)', date: '2026-11-08' },
  { name: "Guru Nanak's Birthday", date: '2026-11-24' },
  { name: 'Christmas Day', date: '2026-12-25' },
];

const HOLIDAY_SET = new Set(HOLIDAYS_2026.map((h) => h.date));

const FIRST_NAMES = [
  'Aanya', 'Aditi', 'Akshay', 'Alok', 'Amit', 'Anika', 'Asha', 'Bhavesh', 'Chetan', 'Deepa',
  'Dhruv', 'Esha', 'Faisal', 'Gauri', 'Hemant', 'Indira', 'Jatin', 'Jyoti', 'Kabir', 'Kirti',
  'Leela', 'Madhav', 'Naina', 'Omkar', 'Parul', 'Qasim', 'Ravi', 'Sagar', 'Tara', 'Uday',
  'Veena', 'Wasim', 'Xavier', 'Yamini', 'Zara', 'Bhavna', 'Chirag', 'Damini', 'Ekta', 'Fahad',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Joshi', 'Desai',
  'Mehta', 'Shah', 'Kapoor', 'Malhotra', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Pillai', 'Rao', 'Verma',
  'Chopra', 'Bhatia', 'Saxena', 'Agarwal', 'Sinha', 'Kulkarni', 'Thakur', 'Dubey', 'Pandey', 'Rawat',
  'Gill', 'Bose', 'Chawla', 'Sethi', 'Trivedi', 'Ansari', 'Hussain', 'Sheikh', 'Lambert', 'Dsouza',
];

function d(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function dec(value: string | number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function parseTimeMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function computeDayHours(startTime: string, endTime: string, breakHours: number): Prisma.Decimal {
  const minutes = parseTimeMinutes(endTime) - parseTimeMinutes(startTime) - breakHours * 60;
  return dec((minutes / 60).toFixed(2));
}

function isoWeekday(dateStr: string): number {
  const day = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00.000Z`);
  const endDate = new Date(`${end}T12:00:00.000Z`);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function hashStatus(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}

function generatedName(index: number): { firstName: string; lastName: string } {
  return {
    firstName: FIRST_NAMES[index % FIRST_NAMES.length],
    lastName: LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length],
  };
}

function jobForDept(deptCode: string): string {
  if (deptCode === 'ENG') return 'Engineer';
  if (deptCode === 'FIN') return 'Accountant';
  if (deptCode === 'HR') return 'HR Executive';
  if (deptCode === 'SLS') return 'Sales Executive';
  return 'Support Specialist';
}

async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "payslip_lines",
      "payslips",
      "payruns",
      "notifications",
      "time_off_requests",
      "time_off_allocations",
      "attendance_records",
      "contracts",
      "salary_rules",
      "salary_structures",
      "time_off_types",
      "refresh_tokens",
      "auth_tokens",
      "users",
      "employees",
      "departments",
      "working_schedule_days",
      "working_schedules",
      "public_holidays",
      "companies"
    RESTART IDENTITY CASCADE
  `);
}

type ScheduleDayDef = { dayOfWeek: number; startTime: string; endTime: string; breakHours: number };

function buildScheduleDays(days: ScheduleDayDef[]) {
  const hoursPerDay = days.map((day) => ({
    ...day,
    breakHours: dec(day.breakHours),
    hours: computeDayHours(day.startTime, day.endTime, day.breakHours),
  }));
  const hoursPerWeek = hoursPerDay.reduce((sum, day) => sum.add(day.hours), dec(0));
  return { days: hoursPerDay, daysPerWeek: days.length, hoursPerWeek };
}

async function main(): Promise<void> {
  await truncateAll();

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const personalAdminHash = await hashPassword('pmscrm007');

  const company = await prisma.company.create({
    data: {
      name: 'OXP Pvt Ltd',
      baseCurrency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });

  const scheduleDefs = [
    {
      name: '40 Hours / Week',
      days: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakHours: 1 },
      ],
    },
    {
      name: 'Night Shift',
      days: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '23:00', breakHours: 1 },
        { dayOfWeek: 2, startTime: '14:00', endTime: '23:00', breakHours: 1 },
        { dayOfWeek: 3, startTime: '14:00', endTime: '23:00', breakHours: 1 },
        { dayOfWeek: 4, startTime: '14:00', endTime: '23:00', breakHours: 1 },
        { dayOfWeek: 5, startTime: '14:00', endTime: '23:00', breakHours: 1 },
      ],
    },
    {
      name: 'Flexible Hybrid',
      days: [
        { dayOfWeek: 1, startTime: '09:30', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 2, startTime: '09:30', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 3, startTime: '09:30', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 4, startTime: '09:30', endTime: '18:00', breakHours: 1 },
        { dayOfWeek: 5, startTime: '09:30', endTime: '18:00', breakHours: 1 },
      ],
    },
    {
      name: 'Part-time 20h',
      days: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '14:00', breakHours: 0 },
        { dayOfWeek: 2, startTime: '09:00', endTime: '14:00', breakHours: 0 },
        { dayOfWeek: 3, startTime: '09:00', endTime: '14:00', breakHours: 0 },
        { dayOfWeek: 4, startTime: '09:00', endTime: '14:00', breakHours: 0 },
      ],
    },
  ];

  const schedules: Record<string, { id: string; workingDays: Set<number> }> = {};
  for (const def of scheduleDefs) {
    const computed = buildScheduleDays(def.days);
    const schedule = await prisma.workingSchedule.create({
      data: {
        companyId: company.id,
        name: def.name,
        timezone: company.timezone,
        daysPerWeek: computed.daysPerWeek,
        hoursPerWeek: computed.hoursPerWeek,
        days: {
          create: computed.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            breakHours: day.breakHours,
            hours: day.hours,
          })),
        },
      },
    });
    schedules[def.name] = {
      id: schedule.id,
      workingDays: new Set(def.days.map((day) => day.dayOfWeek)),
    };
  }

  for (const holiday of HOLIDAYS_2026) {
    await prisma.publicHoliday.create({
      data: { companyId: company.id, name: holiday.name, date: d(holiday.date) },
    });
  }

  // 28 + 24 + 70 + 48 + 30 = 200
  const deptDefs = [
    {
      name: 'Finance',
      code: 'FIN',
      count: 28,
      manager: { firstName: 'Sara', lastName: 'Khan' },
      reserved: [
        { firstName: 'Ananya', lastName: 'Iyer' },
        { firstName: 'Vikram', lastName: 'Reddy' },
        { firstName: 'Neha', lastName: 'Gupta' },
      ],
    },
    {
      name: 'HR',
      code: 'HR',
      count: 24,
      manager: { firstName: 'Maya', lastName: 'Shah' },
      reserved: [
        { firstName: 'Ritu', lastName: 'Verma' },
        { firstName: 'Aditya', lastName: 'Chopra' },
        { firstName: 'Pooja', lastName: 'Saxena' },
      ],
    },
    {
      name: 'Engineering',
      code: 'ENG',
      count: 70,
      manager: { firstName: 'John', lastName: 'Dsouza' },
      reserved: [
        { firstName: 'Aarav', lastName: 'Mehta' },
        { firstName: 'Isha', lastName: 'Kapoor' },
        { firstName: 'Dev', lastName: 'Menon' },
        { firstName: 'Sneha', lastName: 'Rao' },
        { firstName: 'Rahul', lastName: 'Joshi' },
      ],
    },
    {
      name: 'Sales',
      code: 'SLS',
      count: 48,
      manager: { firstName: 'Rohan', lastName: 'Patel' },
      reserved: [
        { firstName: 'Eli', lastName: 'Lambert' },
        { firstName: 'Sanjay', lastName: 'Mehra' },
        { firstName: 'Ankit', lastName: 'Sethi' },
        { firstName: 'Reema', lastName: 'Das' },
      ],
    },
    {
      name: 'Support',
      code: 'SUP',
      count: 30,
      manager: { firstName: 'Priya', lastName: 'Nair' },
      reserved: [
        { firstName: 'Geeta', lastName: 'Krishnan' },
        { firstName: 'Omar', lastName: 'Hussain' },
        { firstName: 'Trisha', lastName: 'Mukherjee' },
      ],
    },
  ];

  const departments: Record<string, string> = {};
  for (const dept of deptDefs) {
    const created = await prisma.department.create({
      data: { companyId: company.id, name: dept.name, code: dept.code },
    });
    departments[dept.code] = created.id;
  }

  const schedule40 = schedules['40 Hours / Week'];

  type EmployeeSeed = {
    id?: string;
    firstName: string;
    lastName: string;
    deptCode: string;
    jobPosition: string;
    employeeType: string;
    status: string;
    scheduleName: string;
    joiningDate: string;
    bankFilled: boolean;
  };

  const employeeSeeds: EmployeeSeed[] = [];
  let inactiveCount = 0;
  const typeCounts = { full_time: 0, part_time: 0, contract: 0, intern: 0 };
  // ~75% FT / 12.5% PT / 7.5% contract / 5% intern of 200
  const typeTargets = { full_time: 150, part_time: 25, contract: 15, intern: 10 };
  const inactiveTarget = 20;

  function nextType(): string {
    for (const t of ['full_time', 'part_time', 'contract', 'intern'] as const) {
      if (typeCounts[t] < typeTargets[t]) {
        typeCounts[t]++;
        return t;
      }
    }
    typeCounts.full_time++;
    return 'full_time';
  }

  let empIndex = 0;
  let nameCursor = 0;
  for (const dept of deptDefs) {
    const reserved = [dept.manager, ...dept.reserved];
    const names: { firstName: string; lastName: string }[] = [...reserved];
    while (names.length < dept.count) {
      names.push(generatedName(nameCursor++));
    }

    for (const person of names.slice(0, dept.count)) {
      empIndex++;
      const isAarav = person.firstName === 'Aarav' && person.lastName === 'Mehta';
      const isManager =
        person.firstName === dept.manager.firstName && person.lastName === dept.manager.lastName;
      const isInactive =
        !isAarav &&
        !isManager &&
        inactiveCount < inactiveTarget &&
        empIndex % 10 === 0;
      if (isInactive) inactiveCount++;

      const empType = nextType();
      const scheduleName =
        empType === 'part_time'
          ? 'Part-time 20h'
          : empType === 'intern'
            ? 'Flexible Hybrid'
            : empType === 'contract' && empIndex % 7 === 0
              ? 'Night Shift'
              : '40 Hours / Week';

      const resolvedType = isAarav ? 'full_time' : empType;
      if (isAarav && empType !== 'full_time') {
        typeCounts[empType as keyof typeof typeCounts]--;
        typeCounts.full_time++;
      }

      employeeSeeds.push({
        id: isAarav ? AARAV_EMPLOYEE_ID : undefined,
        firstName: person.firstName,
        lastName: person.lastName,
        deptCode: dept.code,
        jobPosition: isAarav ? 'Software Engineer' : jobForDept(dept.code),
        employeeType: resolvedType,
        status: isInactive ? 'inactive' : 'active',
        scheduleName: isAarav ? '40 Hours / Week' : scheduleName,
        joiningDate: isAarav ? '2025-07-01' : `2024-${String((empIndex % 12) + 1).padStart(2, '0')}-15`,
        bankFilled: true,
      });
    }
  }

  if (employeeSeeds.length !== TARGET_EMPLOYEES) {
    throw new Error(`Expected ${TARGET_EMPLOYEES} employee seeds, got ${employeeSeeds.length}`);
  }

  // Demo: exactly two active employees with null bank (neither Aarav). Deterministic picks.
  const nullBankEmployeeIds = new Set<string>();
  const nullBankCandidates = employeeSeeds
    .map((seed, idx) => ({ seed, idx }))
    .filter(
      ({ seed }) =>
        seed.status === 'active' &&
        !(seed.firstName === 'Aarav' && seed.lastName === 'Mehta') &&
        !(seed.firstName === 'Maya' && seed.lastName === 'Shah'),
    );
  for (const { idx } of nullBankCandidates.slice(0, 2)) {
    employeeSeeds[idx].bankFilled = false;
  }

  const employees: {
    id: string;
    deptCode: string;
    status: string;
    employeeType: string;
    scheduleId: string;
    workingDays: Set<number>;
    firstName: string;
    lastName: string;
    jobPosition: string;
  }[] = [];

  for (let i = 0; i < employeeSeeds.length; i++) {
    const seed = employeeSeeds[i];
    const sched = schedules[seed.scheduleName];
    const slug = `${seed.firstName}.${seed.lastName}`.toLowerCase().replace(/\s/g, '');
    const created = await prisma.employee.create({
      data: {
        id: seed.id,
        companyId: company.id,
        firstName: seed.firstName,
        lastName: seed.lastName,
        workEmail: `${slug}.${String(i + 1).padStart(3, '0')}@oxp.test`,
        departmentId: departments[seed.deptCode],
        jobPosition: seed.jobPosition,
        workingScheduleId: sched.id,
        employeeType: seed.employeeType,
        status: seed.status,
        joiningDate: d(seed.joiningDate),
        workLocation: 'Mumbai',
        bankName: seed.bankFilled ? 'HDFC Bank' : null,
        bankAccountHolder: seed.bankFilled ? `${seed.firstName} ${seed.lastName}` : null,
        bankAccountNumber: seed.bankFilled ? `0001234${String(i).padStart(4, '0')}` : null,
        bankIfsc: seed.bankFilled ? 'HDFC0001234' : null,
      },
    });
    if (!seed.bankFilled) nullBankEmployeeIds.add(created.id);
    employees.push({
      id: created.id,
      deptCode: seed.deptCode,
      status: seed.status,
      employeeType: seed.employeeType,
      scheduleId: sched.id,
      workingDays: sched.workingDays,
      firstName: seed.firstName,
      lastName: seed.lastName,
      jobPosition: seed.jobPosition,
    });
  }

  for (const dept of deptDefs) {
    const mgr = employees.find(
      (e) => e.deptCode === dept.code && e.firstName === dept.manager.firstName && e.lastName === dept.manager.lastName,
    );
    if (mgr) {
      await prisma.department.update({
        where: { id: departments[dept.code] },
        data: { managerId: mgr.id },
      });
      await prisma.employee.updateMany({
        where: { departmentId: departments[dept.code], id: { not: mgr.id } },
        data: { managerId: mgr.id },
      });
    }
  }

  const regularStructure = await prisma.salaryStructure.create({
    data: {
      companyId: company.id,
      name: 'Regular Salary',
      code: 'REGULAR',
      rules: {
        create: [
          { name: 'Basic', code: 'BASIC', category: 'basic', sequence: 1, computation: 'formula', formula: 'CONTRACT_WAGE * 0.5 * PRORATION' },
          { name: 'HRA', code: 'HRA', category: 'allowance', sequence: 10, computation: 'percentage', percentage: dec('20'), percentageBase: 'basic' },
          { name: 'Standard Allowance', code: 'STD', category: 'allowance', sequence: 20, computation: 'fixed', amount: dec('10000') },
          { name: 'Bonus', code: 'BONUS', category: 'allowance', sequence: 30, computation: 'formula', formula: 'round({BASIC} * 5%)' },
          { name: 'LTA', code: 'LTA', category: 'allowance', sequence: 40, computation: 'fixed', amount: dec('5000') },
          { name: 'Flexible Allowance', code: 'FIX', category: 'allowance', sequence: 50, computation: 'formula', formula: 'max(0, CONTRACT_WAGE * PRORATION - {BASIC} - {HRA} - {STD} - {BONUS} - {LTA})' },
          { name: 'Gross', code: 'GROSS', category: 'gross', sequence: 60, computation: 'formula', formula: '{BASIC} + ALLOWANCE' },
          { name: 'Labour Welfare Fund', code: 'LWF', category: 'deduction', sequence: 70, computation: 'fixed', amount: dec('200') },
          { name: 'Provident Fund', code: 'PF', category: 'deduction', sequence: 80, computation: 'percentage', percentage: dec('12'), percentageBase: 'basic' },
          { name: 'ESIC', code: 'ESIC', category: 'deduction', sequence: 90, computation: 'formula', formula: 'round({GROSS} * 0.75%)' },
          { name: 'Professional Tax', code: 'PT', category: 'deduction', sequence: 100, computation: 'fixed', amount: dec('200') },
          { name: 'Net Pay', code: 'NET', category: 'net', sequence: 110, computation: 'formula', formula: '{GROSS} - DEDUCTION' },
        ],
      },
    },
  });

  await prisma.salaryStructure.create({
    data: {
      companyId: company.id,
      name: 'Intern Salary',
      code: 'INTERN',
      rules: {
        create: [
          { name: 'Stipend', code: 'STIPEND', category: 'basic', sequence: 1, computation: 'formula', formula: 'CONTRACT_WAGE * PRORATION' },
          { name: 'Transport', code: 'TRANS', category: 'allowance', sequence: 10, computation: 'fixed', amount: dec('2000') },
          { name: 'Meal', code: 'MEAL', category: 'allowance', sequence: 20, computation: 'fixed', amount: dec('1500') },
          { name: 'Gross', code: 'GROSS', category: 'gross', sequence: 30, computation: 'formula', formula: '{STIPEND} + {TRANS} + {MEAL}' },
          { name: 'TDS', code: 'TDS', category: 'deduction', sequence: 40, computation: 'percentage', percentage: dec('10'), percentageBase: 'gross' },
          { name: 'Insurance', code: 'INS', category: 'deduction', sequence: 50, computation: 'fixed', amount: dec('100') },
          { name: 'Other', code: 'OTHER', category: 'deduction', sequence: 60, computation: 'fixed', amount: dec('50') },
          { name: 'Net Pay', code: 'NET', category: 'net', sequence: 70, computation: 'formula', formula: '{GROSS} - DEDUCTION' },
        ],
      },
    },
  });

  const contractorStructure = await prisma.salaryStructure.create({
    data: {
      companyId: company.id,
      name: 'Contractor',
      code: 'CONTRACT',
      rules: {
        create: [
          { name: 'Contract Fee', code: 'FEE', category: 'basic', sequence: 1, computation: 'formula', formula: 'CONTRACT_WAGE * PRORATION' },
          { name: 'Gross', code: 'GROSS', category: 'gross', sequence: 10, computation: 'formula', formula: '{FEE}' },
          { name: 'TDS', code: 'TDS', category: 'deduction', sequence: 20, computation: 'percentage', percentage: dec('10'), percentageBase: 'gross' },
          { name: 'GST Withholding', code: 'GST', category: 'deduction', sequence: 30, computation: 'percentage', percentage: dec('2'), percentageBase: 'gross' },
          { name: 'Admin Fee', code: 'ADMIN', category: 'deduction', sequence: 40, computation: 'fixed', amount: dec('500') },
          { name: 'Net Pay', code: 'NET', category: 'net', sequence: 50, computation: 'formula', formula: '{GROSS} - DEDUCTION' },
        ],
      },
    },
  });

  const internStructure = await prisma.salaryStructure.findFirst({ where: { code: 'INTERN' } });

  const ptoType = await prisma.timeOffType.create({
    data: {
      companyId: company.id,
      name: 'Paid Time Off',
      code: 'PTO',
      unit: 'days',
      requiresAllocation: true,
      isPaid: true,
      color: '#2563a8',
    },
  });

  const sickType = await prisma.timeOffType.create({
    data: {
      companyId: company.id,
      name: 'Sick Leave',
      code: 'SICK',
      unit: 'days',
      requiresAllocation: true,
      isPaid: true,
      color: '#1a6b47',
    },
  });

  const compType = await prisma.timeOffType.create({
    data: {
      companyId: company.id,
      name: 'Comp Off',
      code: 'COMP',
      unit: 'hours',
      requiresAllocation: true,
      isPaid: true,
      color: '#8a5a00',
    },
  });

  await prisma.timeOffType.create({
    data: {
      companyId: company.id,
      name: 'Unpaid Leave',
      code: 'UNPAID',
      unit: 'days',
      requiresAllocation: false,
      isPaid: false,
      color: '#a32330',
    },
  });

  const activeEmployees = employees.filter((e) => e.status === 'active');
  const inactiveEmployees = employees.filter((e) => e.status === 'inactive');
  const hrManagerEmployee = employees.find((e) => e.firstName === 'Maya' && e.lastName === 'Shah');

  await prisma.user.createMany({
    data: [
      { id: USER_IDS.admin, email: 'admin@peoplepay360.test', passwordHash, role: 'admin', status: 'active' },
      {
        id: USER_IDS.admin_dev,
        email: 'shahmrunal777@gmail.com',
        passwordHash: personalAdminHash,
        role: 'admin',
        status: 'active',
      },
      {
        id: USER_IDS.hr_manager,
        email: 'hr.manager@peoplepay360.test',
        passwordHash,
        role: 'hr_manager',
        status: 'active',
        employeeId: hrManagerEmployee?.id ?? null,
      },
      { id: USER_IDS.hr_payroll_user, email: 'payroll.user@peoplepay360.test', passwordHash, role: 'hr_payroll_user', status: 'active' },
      { id: USER_IDS.hr_payroll_manager, email: 'payroll.manager@peoplepay360.test', passwordHash, role: 'hr_payroll_manager', status: 'active' },
      {
        id: USER_IDS.employee,
        email: 'aarav.mehta@peoplepay360.test',
        passwordHash,
        role: 'employee',
        status: 'active',
        employeeId: AARAV_EMPLOYEE_ID,
      },
      { email: 'invite.pending@peoplepay360.test', role: 'hr_payroll_user', status: 'invited' },
      { email: 'disabled.user@peoplepay360.test', passwordHash, role: 'employee', status: 'disabled' },
    ],
  });

  let contractSeq = 1;
  function nextRef(year: number): string {
    const ref = `CON/${year}/${String(contractSeq).padStart(4, '0')}`;
    contractSeq++;
    return ref;
  }

  const contractsByEmployee = new Map<string, string>();
  const expiringContractIds: string[] = [];
  let usdCount = 0;

  for (const emp of activeEmployees) {
    const structureId =
      emp.employeeType === 'intern'
        ? internStructure!.id
        : emp.employeeType === 'contract'
          ? contractorStructure.id
          : regularStructure.id;

    const isEli = emp.firstName === 'Eli' && emp.lastName === 'Lambert';
    const isUsd = isEli || (emp.employeeType === 'contract' && usdCount < 2 && !isEli);
    if (isUsd) usdCount++;

    const wage =
      emp.employeeType === 'intern'
        ? dec('25000')
        : isUsd
          ? dec('4350')
          : dec(String(45000 + (emp.id.charCodeAt(0) % 20) * 2500));

    const endsSep =
      expiringContractIds.length < 3 &&
      emp.firstName !== 'Aarav' &&
      emp.deptCode === 'SLS' &&
      emp.status === 'active';

    const running = await prisma.contract.create({
      data: {
        reference: nextRef(2026),
        employeeId: emp.id,
        departmentId: departments[emp.deptCode],
        jobPosition: emp.jobPosition,
        workingScheduleId: emp.scheduleId,
        salaryStructureId: structureId,
        startDate: d('2026-01-01'),
        endDate: endsSep ? d('2026-09-30') : null,
        wage,
        currency: isUsd ? 'USD' : 'INR',
        status: 'running',
      },
    });
    contractsByEmployee.set(emp.id, running.id);
    if (endsSep) expiringContractIds.push(running.id);
  }

  await prisma.contract.create({
    data: {
      reference: nextRef(2025),
      employeeId: AARAV_EMPLOYEE_ID,
      departmentId: departments.ENG,
      jobPosition: 'Software Engineer',
      workingScheduleId: schedule40.id,
      salaryStructureId: regularStructure.id,
      startDate: d('2025-07-01'),
      endDate: d('2025-12-31'),
      wage: dec('78000'),
      currency: 'INR',
      status: 'expired',
    },
  });

  await prisma.contract.updateMany({
    where: { employeeId: AARAV_EMPLOYEE_ID, status: 'running' },
    data: { wage: dec('85000') },
  });

  for (const emp of inactiveEmployees) {
    await prisma.contract.create({
      data: {
        reference: nextRef(2024),
        employeeId: emp.id,
        departmentId: departments[emp.deptCode],
        jobPosition: 'Former Staff',
        workingScheduleId: emp.scheduleId,
        salaryStructureId: regularStructure.id,
        startDate: d('2024-06-01'),
        endDate: d('2025-12-31'),
        wage: dec('40000'),
        currency: 'INR',
        status: 'expired',
      },
    });
  }

  // Extra historical expired contracts for volume / history UI
  for (let i = 0; i < 40; i++) {
    const emp = activeEmployees[i % activeEmployees.length];
    if (emp.id === AARAV_EMPLOYEE_ID) continue;
    await prisma.contract.create({
      data: {
        reference: nextRef(2024),
        employeeId: emp.id,
        departmentId: departments[emp.deptCode],
        jobPosition: 'Previous Role',
        workingScheduleId: emp.scheduleId,
        salaryStructureId: regularStructure.id,
        startDate: d('2024-01-01'),
        endDate: d('2024-12-31'),
        wage: dec('35000'),
        currency: 'INR',
        status: 'expired',
      },
    });
  }

  // Draft + cancelled contracts for status coverage
  for (let i = 0; i < 5; i++) {
    const emp = activeEmployees[(i + 40) % activeEmployees.length];
    await prisma.contract.create({
      data: {
        reference: nextRef(2026),
        employeeId: emp.id,
        departmentId: departments[emp.deptCode],
        jobPosition: emp.jobPosition,
        workingScheduleId: emp.scheduleId,
        salaryStructureId: regularStructure.id,
        startDate: d('2026-10-01'),
        endDate: null,
        wage: dec('50000'),
        currency: 'INR',
        status: 'draft',
        notes: 'Offer pending activation',
      },
    });
  }
  for (let i = 0; i < 5; i++) {
    const emp = activeEmployees[(i + 50) % activeEmployees.length];
    await prisma.contract.create({
      data: {
        reference: nextRef(2025),
        employeeId: emp.id,
        departmentId: departments[emp.deptCode],
        jobPosition: emp.jobPosition,
        workingScheduleId: emp.scheduleId,
        salaryStructureId: regularStructure.id,
        startDate: d('2025-03-01'),
        endDate: d('2025-06-30'),
        wage: dec('42000'),
        currency: 'INR',
        status: 'cancelled',
        notes: 'Cancelled before start',
      },
    });
  }

  const ptoAllocations = new Map<string, string>();
  for (const emp of activeEmployees) {
    const allocated = emp.id === AARAV_EMPLOYEE_ID ? dec('20') : dec(String(18 + (emp.id.charCodeAt(2) % 5)));
    const alloc = await prisma.timeOffAllocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: ptoType.id,
        allocated,
        validFrom: d('2026-01-01'),
        validTo: d('2026-12-31'),
        status: 'approved',
        approverId: hrManagerEmployee?.id ?? null,
        description: 'Annual PTO 2026',
      },
    });
    ptoAllocations.set(emp.id, alloc.id);
  }

  for (const emp of activeEmployees) {
    await prisma.timeOffAllocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: sickType.id,
        allocated: dec('20'),
        validFrom: d('2026-01-01'),
        validTo: d('2026-12-31'),
        status: 'approved',
        approverId: hrManagerEmployee?.id ?? null,
        description: 'Annual Sick Leave 2026',
      },
    });
  }

  const compEmployees = activeEmployees.slice(0, 30);
  for (const emp of compEmployees) {
    await prisma.timeOffAllocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: compType.id,
        allocated: dec('16'),
        validFrom: d('2026-01-01'),
        validTo: d('2026-12-31'),
        status: 'approved',
        approverId: hrManagerEmployee?.id ?? null,
        description: 'Comp off balance',
      },
    });
  }

  for (let i = 0; i < 8; i++) {
    const emp = activeEmployees[(i + 60) % activeEmployees.length];
    await prisma.timeOffAllocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: i % 2 === 0 ? ptoType.id : compType.id,
        allocated: dec(i % 2 === 0 ? '5' : '8'),
        validFrom: d('2026-10-01'),
        validTo: d('2026-12-31'),
        status: 'draft',
      },
    });
  }

  for (let i = 0; i < 4; i++) {
    const emp = activeEmployees[(i + 70) % activeEmployees.length];
    await prisma.timeOffAllocation.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: ptoType.id,
        allocated: dec('3'),
        validFrom: d('2026-11-01'),
        validTo: d('2026-12-31'),
        status: 'refused',
        approverId: hrManagerEmployee?.id ?? null,
        description: 'Mid-year top-up refused',
      },
    });
  }

  const aaravAllocId = ptoAllocations.get(AARAV_EMPLOYEE_ID)!;
  const approvedRequests: {
    empId: string;
    typeId: string;
    allocId?: string;
    start: string;
    end: string;
    durationType: string;
    days: string;
    hours: string;
    requestedHours?: string;
  }[] = [
    { empId: AARAV_EMPLOYEE_ID, typeId: ptoType.id, allocId: aaravAllocId, start: '2026-07-10', end: '2026-07-14', durationType: 'full_day', days: '5', hours: '40' },
    { empId: AARAV_EMPLOYEE_ID, typeId: ptoType.id, allocId: aaravAllocId, start: '2026-08-01', end: '2026-08-03', durationType: 'full_day', days: '3', hours: '24' },
    { empId: activeEmployees[3].id, typeId: ptoType.id, allocId: ptoAllocations.get(activeEmployees[3].id), start: '2026-07-20', end: '2026-07-22', durationType: 'full_day', days: '3', hours: '24' },
    { empId: activeEmployees[5].id, typeId: ptoType.id, allocId: ptoAllocations.get(activeEmployees[5].id), start: '2026-08-05', end: '2026-08-05', durationType: 'half_day', days: '0.5', hours: '4' },
    { empId: compEmployees[0].id, typeId: compType.id, start: '2026-08-12', end: '2026-08-12', durationType: 'hours', days: '0.5', hours: '4', requestedHours: '4' },
  ];

  for (let i = 0; i < 65; i++) {
    const emp = activeEmployees[(i + 7) % activeEmployees.length];
    const day = String((i % 25) + 1).padStart(2, '0');
    const month = i % 2 === 0 ? '07' : '08';
    approvedRequests.push({
      empId: emp.id,
      typeId: ptoType.id,
      allocId: ptoAllocations.get(emp.id),
      start: `2026-${month}-${day}`,
      end: `2026-${month}-${day}`,
      durationType: 'full_day',
      days: '1',
      hours: '8',
    });
  }

  for (const req of approvedRequests) {
    await prisma.timeOffRequest.create({
      data: {
        employeeId: req.empId,
        timeOffTypeId: req.typeId,
        allocationId: req.allocId ?? null,
        startDate: d(req.start),
        endDate: d(req.end),
        durationType: req.durationType,
        requestedHours: req.requestedHours ? dec(req.requestedHours) : null,
        durationDays: dec(req.days),
        durationHours: dec(req.hours),
        status: 'approved',
        approverId: hrManagerEmployee?.id ?? null,
      },
    });
  }

  for (let i = 0; i < 15; i++) {
    const emp = activeEmployees[(i + 2) % activeEmployees.length];
    await prisma.timeOffRequest.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: ptoType.id,
        allocationId: ptoAllocations.get(emp.id),
        startDate: d('2026-09-20'),
        endDate: d('2026-09-22'),
        durationType: 'full_day',
        durationDays: dec('3'),
        durationHours: dec('24'),
        status: 'to_approve',
        reason: 'Family event',
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const emp = activeEmployees[(i + 20) % activeEmployees.length];
    await prisma.timeOffRequest.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: sickType.id,
        startDate: d(`2026-08-${String(10 + (i % 18)).padStart(2, '0')}`),
        endDate: d(`2026-08-${String(10 + (i % 18)).padStart(2, '0')}`),
        durationType: 'full_day',
        durationDays: dec('1'),
        durationHours: dec('8'),
        status: 'refused',
        approverId: hrManagerEmployee?.id ?? null,
        refusalReason: 'Insufficient documentation',
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    const emp = activeEmployees[(i + 90) % activeEmployees.length];
    await prisma.timeOffRequest.create({
      data: {
        employeeId: emp.id,
        timeOffTypeId: ptoType.id,
        allocationId: ptoAllocations.get(emp.id),
        startDate: d('2026-09-08'),
        endDate: d('2026-09-09'),
        durationType: 'full_day',
        durationDays: dec('2'),
        durationHours: dec('16'),
        status: 'cancelled',
        reason: 'Plans changed',
      },
    });
  }

  let missingCheckout = false;
  let manualEditCount = 0;
  const attendanceBatch: Prisma.AttendanceRecordCreateManyInput[] = [];

  for (const emp of activeEmployees) {
    for (const dateStr of dateRange('2026-07-01', '2026-09-04')) {
      if (HOLIDAY_SET.has(dateStr)) continue;
      if (!emp.workingDays.has(isoWeekday(dateStr))) continue;

      let status: string;
      if (emp.id === AARAV_EMPLOYEE_ID && dateStr === '2026-09-02') {
        status = 'absent';
      } else if (emp.id === AARAV_EMPLOYEE_ID && dateStr === '2026-09-03') {
        status = 'late';
      } else {
        const bucket = hashStatus(`${emp.id}-${dateStr}`);
        if (bucket < 90) status = 'present';
        else if (bucket < 95) status = 'late';
        else if (bucket < 98) status = 'absent';
        else status = 'half_day';
      }

      const isManual = manualEditCount < 3 && hashStatus(`manual-${emp.id}-${dateStr}`) === 0;
      if (isManual) manualEditCount++;

      // 2026-08-14 is a working Friday; 08-15 is Independence Day and skipped above
      const skipCheckout = !missingCheckout && emp.id === activeEmployees[0].id && dateStr === '2026-08-14';
      if (skipCheckout) missingCheckout = true;

      const checkIn =
        status === 'absent'
          ? null
          : new Date(`${dateStr}T${status === 'late' ? '09:45' : '09:00'}:00+05:30`);
      const checkOut =
        status === 'absent' || skipCheckout
          ? null
          : new Date(`${dateStr}T${status === 'half_day' ? '13:00' : '18:00'}:00+05:30`);

      let workedHours = dec('0');
      if (checkIn && checkOut) {
        workedHours = dec(((checkOut.getTime() - checkIn.getTime()) / 3600000).toFixed(2));
      }

      attendanceBatch.push({
        employeeId: emp.id,
        date: d(dateStr),
        checkIn,
        checkOut,
        workedHours,
        overtimeHours: dec('0'),
        status,
        isManualEdit: isManual,
      });
    }
  }

  // createMany batches keep Postgres packet size reasonable
  const ATTENDANCE_CHUNK = 2000;
  for (let i = 0; i < attendanceBatch.length; i += ATTENDANCE_CHUNK) {
    await prisma.attendanceRecord.createMany({ data: attendanceBatch.slice(i, i + ATTENDANCE_CHUNK) });
  }

  const payrunDefs = [
    { name: 'July 2026', periodStart: '2026-07-01', periodEnd: '2026-07-31', status: 'paid', paidAt: new Date('2026-08-05T10:00:00.000Z') },
    { name: 'August 2026', periodStart: '2026-08-01', periodEnd: '2026-08-31', status: 'validated' },
    { name: 'September 2026', periodStart: '2026-09-01', periodEnd: '2026-09-30', status: 'draft' },
  ];

  let archivedDone = false;
  for (const run of payrunDefs) {
    const payrun = await prisma.payrun.create({
      data: {
        companyId: company.id,
        name: run.name,
        salaryStructureId: regularStructure.id,
        periodStart: d(run.periodStart),
        periodEnd: d(run.periodEnd),
        payoutCurrency: 'INR',
        exchangeRate: dec('1'),
        status: run.status,
        paidAt: run.paidAt ?? null,
        createdById: USER_IDS.hr_payroll_user,
      },
    });

    if (run.status === 'draft') continue;

    for (const emp of activeEmployees) {
      const contractId = contractsByEmployee.get(emp.id);
      const wageNum = emp.id === AARAV_EMPLOYEE_ID ? 85000 : 45000 + (emp.id.charCodeAt(0) % 20) * 2500;
      const basic = dec((wageNum * 0.5 * 0.95).toFixed(2));
      const gross = dec((wageNum * 0.95).toFixed(2));
      const deductions = dec((gross.toNumber() * 0.15).toFixed(2));
      const net = dec((gross.toNumber() - deductions.toNumber()).toFixed(2));

      const archived =
        run.status === 'validated' && !archivedDone && emp.id === activeEmployees[1].id;
      if (archived) archivedDone = true;

      await prisma.payslip.create({
        data: {
          payrunId: payrun.id,
          employeeId: emp.id,
          contractId: contractId ?? null,
          salaryStructureId: regularStructure.id,
          periodStart: d(run.periodStart),
          periodEnd: d(run.periodEnd),
          currency: 'INR',
          payoutCurrency: 'INR',
          exchangeRate: dec('1'),
          scheduledDays: dec('22'),
          workedDays: dec('21'),
          paidLeaveDays: dec('0.5'),
          unpaidLeaveDays: dec('0'),
          absentDays: dec('0.5'),
          overtimeHours: dec('0'),
          proration: dec('0.954545'),
          basic,
          gross,
          totalDeductions: deductions,
          net,
          status: run.status === 'paid' ? 'paid' : 'done',
          warnings: nullBankEmployeeIds.has(emp.id)
            ? [{ code: 'MISSING_BANK_ACCOUNT', message: 'Bank account missing', blocking: true }]
            : [],
          archivedAt: archived ? new Date('2026-08-20T12:00:00.000Z') : null,
          sentAt: run.status === 'paid' ? new Date('2026-08-06T08:00:00.000Z') : null,
          lines: {
            create: [
              { ruleCode: 'BASIC', ruleName: 'Basic', category: 'basic', sequence: 1, amount: basic },
              { ruleCode: 'GROSS', ruleName: 'Gross', category: 'gross', sequence: 60, amount: gross },
              { ruleCode: 'NET', ruleName: 'Net Pay', category: 'net', sequence: 110, amount: net },
            ],
          },
        },
      });
    }
  }

  const notificationDefs = [
    { type: 'time_off_requested', title: 'Leave request pending', body: 'Sanjay Mehra requested 3 days PTO', linkPath: '/time-off/requests', read: false },
    { type: 'time_off_approved', title: 'Leave approved', body: 'Your PTO for July was approved', linkPath: '/time-off', read: true },
    { type: 'payrun_validated', title: 'August pay run validated', body: 'August 2026 pay run is ready for payment', linkPath: '/payroll/payruns', read: false },
    { type: 'payslip_sent', title: 'Payslip delivered', body: `July payslip sent to ${activeEmployees.length} employees`, linkPath: '/payroll/payslips', read: true },
    { type: 'time_off_refused', title: 'Leave refused', body: 'Sick leave request was refused', linkPath: '/time-off/requests', read: false },
    { type: 'payrun_validated', title: 'Payroll reminder', body: 'September pay run draft awaiting compute', linkPath: '/payroll/payruns', read: true },
    { type: 'time_off_requested', title: 'Multiple leave requests', body: '15 PTO requests awaiting approval', linkPath: '/time-off/requests', read: false },
    { type: 'payslip_sent', title: 'August payslips ready', body: 'Validated August payslips available to employees', linkPath: '/payroll/payslips', read: false },
    { type: 'time_off_approved', title: 'Comp off approved', body: 'Hour-based Comp Off request approved', linkPath: '/time-off', read: true },
    { type: 'payrun_validated', title: 'Contract expiring', body: '3 running contracts end in September', linkPath: '/contracts', read: false },
  ];

  for (const n of notificationDefs) {
    await prisma.notification.create({
      data: {
        userId: USER_IDS.hr_payroll_manager,
        type: n.type,
        title: n.title,
        body: n.body,
        linkPath: n.linkPath,
        readAt: n.read ? new Date('2026-09-01T10:00:00.000Z') : null,
      },
    });
  }

  const [
    companyCount,
    deptCount,
    empCount,
    userCount,
    contractCount,
    attendanceTotal,
    allocationCount,
    requestCount,
    payrunCount,
    payslipCount,
    notificationCount,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.department.count(),
    prisma.employee.count(),
    prisma.user.count(),
    prisma.contract.count(),
    prisma.attendanceRecord.count(),
    prisma.timeOffAllocation.count(),
    prisma.timeOffRequest.count(),
    prisma.payrun.count(),
    prisma.payslip.count(),
    prisma.notification.count(),
  ]);

  const aaravContracts = await prisma.contract.count({ where: { employeeId: AARAV_EMPLOYEE_ID } });
  const nullBankCount = await prisma.employee.count({
    where: { status: 'active', bankAccountNumber: null },
  });
  const septExpiring = await prisma.contract.count({
    where: { status: 'running', endDate: d('2026-09-30') },
  });
  const usdContracts = await prisma.contract.count({ where: { currency: 'USD', status: 'running' } });

  // Demo invariants — fail loud if volume expansion breaks the scripted walkthrough
  if (empCount !== TARGET_EMPLOYEES) throw new Error(`employees=${empCount}, expected ${TARGET_EMPLOYEES}`);
  if (nullBankCount !== 2) throw new Error(`null-bank actives=${nullBankCount}, expected 2`);
  if (aaravContracts < 2) throw new Error(`Aarav contracts=${aaravContracts}, expected >= 2`);
  if (septExpiring !== 3) throw new Error(`Sept-expiring contracts=${septExpiring}, expected 3`);
  if (usdContracts !== 2) throw new Error(`USD running contracts=${usdContracts}, expected 2`);
  if (!missingCheckout) throw new Error('missing check-out attendance row was not seeded');
  if (manualEditCount < 3) throw new Error(`manual edits=${manualEditCount}, expected >= 3`);
  if (!archivedDone) throw new Error('archived August payslip was not seeded');

  console.log(
    `Seed complete (${SEED_DATE}): ${companyCount} company, ${deptCount} departments, ${empCount} employees, ${userCount} users, ${contractCount} contracts, ${allocationCount} allocations, ${requestCount} time-off requests, ${attendanceTotal} attendance records, ${payrunCount} pay runs, ${payslipCount} payslips, ${notificationCount} notifications`,
  );
}

main()
  .catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
