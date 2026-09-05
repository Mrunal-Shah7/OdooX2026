export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  departments: {
    all: ['departments'] as const,
  },
  employees: {
    all: (params?: Record<string, string>) => ['employees', params ?? {}] as const,
    detail: (id: string) => ['employees', id] as const,
  },
  contracts: {
    all: (params?: Record<string, string>) => ['contracts', params ?? {}] as const,
    detail: (id: string) => ['contracts', id] as const,
  },
  schedules: {
    all: ['schedules'] as const,
    detail: (id: string) => ['schedules', id] as const,
  },
  holidays: (year: number) => ['holidays', year] as const,
  attendance: {
    all: (params?: Record<string, string>) => ['attendance', params ?? {}] as const,
    detail: (id: string) => ['attendance', id] as const,
    active: ['attendance', 'active'] as const,
  },
  timeOff: {
    dashboard: (year: number) => ['timeOff', 'dashboard', year] as const,
    types: ['timeOff', 'types'] as const,
    type: (id: string) => ['timeOff', 'types', id] as const,
    allocations: (params?: Record<string, string>) => ['timeOff', 'allocations', params ?? {}] as const,
    allocation: (id: string) => ['timeOff', 'allocations', id] as const,
    requests: (params?: Record<string, string>) => ['timeOff', 'requests', params ?? {}] as const,
    request: (id: string) => ['timeOff', 'requests', id] as const,
  },
  payroll: {
    dashboard: (params?: Record<string, string>) => ['payroll', 'dashboard', params ?? {}] as const,
    payruns: ['payroll', 'payruns'] as const,
    payrun: (id: string) => ['payroll', 'payruns', id] as const,
    payslips: (params?: Record<string, string>) => ['payroll', 'payslips', params ?? {}] as const,
    payslip: (id: string) => ['payroll', 'payslips', id] as const,
    structures: ['payroll', 'structures'] as const,
    structure: (id: string) => ['payroll', 'structures', id] as const,
    rules: ['payroll', 'rules'] as const,
    rule: (id: string) => ['payroll', 'rules', id] as const,
  },
  users: {
    all: ['users'] as const,
  },
  notifications: {
    all: (params?: Record<string, string | number | boolean>) =>
      ['notifications', params ?? {}] as const,
  },
};
