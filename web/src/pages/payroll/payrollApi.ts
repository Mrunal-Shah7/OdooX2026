import { getStoredAuthToken, getStoredUserId } from '../../lib/session';

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
  payrunId: string;
  payrunName: string;
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

export type PayslipDetail = {
  payslip: {
    id: string;
    payrunId: string;
    payrunName: string;
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      workEmail: string;
      jobPosition: string;
      departmentName: string;
    };
    contract: {
      id: string;
      reference: string;
      wage: string;
      currency: string;
    } | null;
    salaryStructure: { id: string; name: string; code: string };
    periodStart: string;
    periodEnd: string;
    currency: 'INR' | 'USD';
    payoutCurrency: 'INR' | 'USD';
    exchangeRate: string;
    scheduledDays: string;
    workedDays: string;
    paidLeaveDays: string;
    unpaidLeaveDays: string;
    absentDays: string;
    overtimeHours: string;
    proration: string;
    basic: string;
    gross: string;
    totalDeductions: string;
    net: string;
    status: 'draft' | 'computed' | 'done' | 'paid';
    archived: boolean;
    sentAt: string | null;
    warnings: { code: string; message: string; blocking: boolean }[];
  };
  lines: PayslipLine[];
};

export type PayslipLine = {
  ruleCode: string;
  ruleName: string;
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net';
  sequence: number;
  amount: string;
};

export type SalaryRule = {
  id: string;
  structureId: string;
  name: string;
  code: string;
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net';
  sequence: number;
  computation: 'fixed' | 'percentage' | 'formula';
  amount: string | null;
  percentage: string | null;
  percentageBase: 'contract_wage' | 'basic' | 'gross' | null;
  formula: string | null;
  active: boolean;
  structure?: { id: string; name: string; code: string };
};

export type SalaryStructureDetail = SalaryStructure & {
  rules: SalaryRule[];
};

export const payrollApi = {
  getSalaryStructures(): Promise<SalaryStructure[]> {
    return request('/api/payroll/structures');
  },

  getSalaryStructure(id: string): Promise<SalaryStructureDetail> {
    return request(`/api/payroll/structures/${id}`);
  },

  createSalaryStructure(data: { name: string; code: string; active?: boolean }): Promise<SalaryStructure> {
    return request('/api/payroll/structures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSalaryStructure(
    id: string,
    data: { name?: string; code?: string; active?: boolean },
  ): Promise<SalaryStructure> {
    return request(`/api/payroll/structures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getSalaryRules(params?: { structureId?: string }): Promise<SalaryRule[]> {
    const query = new URLSearchParams();
    if (params?.structureId) query.set('structureId', params.structureId);
    const qStr = query.toString();
    return request(`/api/payroll/rules${qStr ? `?${qStr}` : ''}`);
  },

  getSalaryRule(id: string): Promise<SalaryRule> {
    return request(`/api/payroll/rules/${id}`);
  },

  createSalaryRule(data: Partial<SalaryRule>): Promise<SalaryRule> {
    return request('/api/payroll/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSalaryRule(id: string, data: Partial<SalaryRule>): Promise<SalaryRule> {
    return request(`/api/payroll/rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteSalaryRule(id: string): Promise<void> {
    return request(`/api/payroll/rules/${id}`, {
      method: 'DELETE',
    });
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

  getPayslips(params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    payrunId?: string;
  }): Promise<PayslipSummary[]> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.payrunId) query.set('payrunId', params.payrunId);

    const qStr = query.toString();
    return request(`/api/payroll/payslips${qStr ? `?${qStr}` : ''}`);
  },

  getPayslip(id: string): Promise<PayslipDetail> {
    return request(`/api/payroll/payslips/${id}`);
  },

  archivePayslip(id: string): Promise<PayslipSummary> {
    return request(`/api/payroll/payslips/${id}/archive`, { method: 'POST' });
  },

  async downloadPayslipPdf(id: string): Promise<Blob> {
    const headers = new Headers();
    const token = getStoredAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const userId = getStoredUserId();
    if (userId) {
      headers.set('x-user-id', userId);
    }

    const response = await fetch(`${baseUrl}/api/payroll/payslips/${id}/pdf`, {
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message || `Failed to download PDF (Status ${response.status})`);
    }

    return response.blob();
  },

  getPayslipPdfUrl(id: string): string {
    const token = getStoredAuthToken();
    const userId = getStoredUserId();
    const query = new URLSearchParams();
    if (token) query.set('token', token);
    if (userId) query.set('userId', userId);
    const qStr = query.toString();
    return `${baseUrl}/api/payroll/payslips/${id}/pdf${qStr ? `?${qStr}` : ''}`;
  },
};

