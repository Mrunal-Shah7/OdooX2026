export type SalaryStructure = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  ruleCount: number;
  employeeCount: number;
};

export type EligibleEmployee = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  contractId: string;
  workingHours: string;
  contractStartDate: string;
  wage: string;
  currency: string;
  alreadyPaid: boolean;
};

export type Payrun = {
  id: string;
  name: string;
  salaryStructure: { id: string; name: string; code: string };
  employeeType: string | null;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'computed' | 'validated' | 'paid';
  payoutCurrency: 'INR' | 'USD';
  exchangeRate: string;
  payslipCount: number;
  warningCount: number;
  totalNet: string;
  paidAt: string | null;
};

export type PayslipSummary = {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  workedDays: string;
  basic: string;
  gross: string;
  net: string;
  currency: 'INR' | 'USD';
  status: 'draft' | 'computed' | 'done' | 'paid';
  archived: boolean;
  sentAt: string | null;
  warnings: { code: string; message: string; blocking: boolean }[];
};

export type PayrunDetailResponse = {
  payrun: Payrun;
  payslips: PayslipSummary[];
};

const baseUrl = '';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error?.message || `Request failed with status ${response.status}`);
  }

  return body?.data !== undefined ? body.data : body;
}

export const payrollApi = {
  getSalaryStructures(): Promise<SalaryStructure[]> {
    return request('/api/payroll/structures');
  },

  getEligibleEmployees(params: {
    periodStart: string;
    periodEnd: string;
    structureId: string;
    employeeType?: string;
  }): Promise<EligibleEmployee[]> {
    const query = new URLSearchParams({
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      structureId: params.structureId,
    });
    if (params.employeeType && params.employeeType !== 'all') {
      query.set('employeeType', params.employeeType);
    }
    return request(`/api/payroll/payruns/eligible-employees?${query.toString()}`);
  },

  getPayruns(): Promise<Payrun[]> {
    return request('/api/payroll/payruns');
  },

  getPayrun(id: string): Promise<PayrunDetailResponse> {
    return request(`/api/payroll/payruns/${id}`);
  },

  createPayrun(data: {
    name: string;
    salaryStructureId: string;
    periodStart: string;
    periodEnd: string;
    payoutCurrency: 'INR' | 'USD';
    exchangeRate?: string;
    employeeIds: string[];
    employeeType?: string | null;
  }): Promise<{ payrun: Payrun; payslips: PayslipSummary[] }> {
    return request('/api/payroll/payruns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  computePayrun(id: string): Promise<PayrunDetailResponse> {
    return request(`/api/payroll/payruns/${id}/compute`, { method: 'POST' });
  },

  validatePayrun(id: string): Promise<PayrunDetailResponse> {
    return request(`/api/payroll/payruns/${id}/validate`, { method: 'POST' });
  },

  markPayrunPaid(id: string): Promise<PayrunDetailResponse> {
    return request(`/api/payroll/payruns/${id}/mark-paid`, { method: 'POST' });
  },

  sendPayslips(id: string): Promise<{ payslipId: string; sent: boolean; error: string | null }[]> {
    return request(`/api/payroll/payruns/${id}/send-payslips`, { method: 'POST' });
  },
};
