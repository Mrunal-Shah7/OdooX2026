import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Amount } from '../../components/ui/Amount';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { DatePicker } from '../../components/ui/DatePicker';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs, type TabItem } from '../../components/ui/Tabs';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';

type ReportColumn = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'money' | 'quantity' | 'date';
};

type ReportData = {
  key: string;
  title: string;
  columns: ReportColumn[];
  rows: Record<string, string | null>[];
};

import { useSession } from '../../lib/session';
import { isHrManagerOrAbove, isPayrollRole } from '../../lib/permissions';

export default function ReportsPage() {
  const { user } = useSession();
  const canAccessReports = user && (isHrManagerOrAbove(user.role) || isPayrollRole(user.role));

  const [activeTab, setActiveTab] = useState('salary');

  // Filters state
  const [periodStart, setPeriodStart] = useState('2026-07-01');
  const [periodEnd, setPeriodEnd] = useState('2026-07-31');
  const [attendancePeriod, setAttendancePeriod] = useState('2026-07');
  const [departmentId, setDepartmentId] = useState('');
  const [withinDays, setWithinDays] = useState('60');

  // Fetch departments for filter
  const { data: departmentsData } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => apiFetch<{ data: Array<{ id: string; name: string }> }>('/departments'),
    enabled: !!canAccessReports,
  });

  const departmentOptions = [
    { label: 'All Departments', value: '' },
    ...(departmentsData?.data ?? []).map((d) => ({ label: d.name, value: d.id })),
  ];

  // Queries for the 5 reports
  const salaryQuery = useQuery({
    queryKey: ['reports', 'salary-register', periodStart, periodEnd, departmentId],
    queryFn: () => {
      const q = new URLSearchParams({
        periodStart,
        periodEnd,
        ...(departmentId ? { departmentId } : {}),
      });
      return apiFetch<{ data: ReportData }>(`/reports/salary-register?${q.toString()}`);
    },
    enabled: activeTab === 'salary',
  });

  const attendanceQuery = useQuery({
    queryKey: ['reports', 'attendance-register', attendancePeriod, departmentId],
    queryFn: () => {
      const q = new URLSearchParams({
        period: attendancePeriod,
        ...(departmentId ? { departmentId } : {}),
      });
      return apiFetch<{ data: ReportData }>(`/reports/attendance-register?${q.toString()}`);
    },
    enabled: activeTab === 'attendance',
  });

  const leaveQuery = useQuery({
    queryKey: ['reports', 'leave-balance', departmentId],
    queryFn: () => {
      const q = new URLSearchParams({
        ...(departmentId ? { departmentId } : {}),
      });
      return apiFetch<{ data: ReportData }>(`/reports/leave-balance?${q.toString()}`);
    },
    enabled: activeTab === 'leave',
  });

  const expiryQuery = useQuery({
    queryKey: ['reports', 'contract-expiry', withinDays, departmentId],
    queryFn: () => {
      const q = new URLSearchParams({
        withinDays,
        ...(departmentId ? { departmentId } : {}),
      });
      return apiFetch<{ data: ReportData }>(`/reports/contract-expiry?${q.toString()}`);
    },
    enabled: activeTab === 'contracts',
  });

  const deptCostQuery = useQuery({
    queryKey: ['reports', 'department-cost', periodStart, periodEnd],
    queryFn: () => {
      const q = new URLSearchParams({ periodStart, periodEnd });
      return apiFetch<{ data: ReportData }>(`/reports/department-cost?${q.toString()}`);
    },
    enabled: activeTab === 'dept',
  });

  const handleExportCsv = async () => {
    let endpoint = '/reports/salary-register';
    let params: Record<string, any> = {};

    if (activeTab === 'salary') {
      endpoint = '/reports/salary-register';
      params = { periodStart, periodEnd, departmentId };
    } else if (activeTab === 'attendance') {
      endpoint = '/reports/attendance-register';
      params = { period: attendancePeriod, departmentId };
    } else if (activeTab === 'leave') {
      endpoint = '/reports/leave-balance';
      params = { departmentId };
    } else if (activeTab === 'contracts') {
      endpoint = '/reports/contract-expiry';
      params = { withinDays, departmentId };
    } else if (activeTab === 'dept') {
      endpoint = '/reports/department-cost';
      params = { periodStart, periodEnd };
    }

    const cleanParams: Record<string, string> = { format: 'csv' };
    Object.entries(params).forEach(([k, v]) => {
      if (v) cleanParams[k] = String(v);
    });

    const queryString = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`/api${endpoint}?${queryString}`, {
      credentials: 'include',
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_report.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  function buildDynamicColumns(reportData?: ReportData): ColumnDef<Record<string, string | null>, any>[] {
    if (!reportData?.columns) return [];
    return reportData.columns.map((col) => {
      const isNumeric = col.type === 'money' || col.type === 'number' || col.type === 'quantity';
      return {
        id: col.key,
        accessorFn: (row) => row[col.key] ?? '',
        header: col.label,
        meta: {
          align: isNumeric ? 'right' : 'left',
          code: col.type === 'date',
        } as ColumnMeta,
        cell: (info) => {
          const val = info.getValue() as string;
          if (col.type === 'money') {
            return <Amount value={val} />;
          }
          if (isNumeric) {
            return <span className="font-mono">{val}</span>;
          }
          if (col.type === 'date') {
            return <span className="font-mono text-caption">{val}</span>;
          }
          return val;
        },
      };
    });
  }

  const tabItems: TabItem[] = [
    {
      value: 'salary',
      label: 'Salary Register',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('salary')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-text-muted">Start:</span>
              <DatePicker
                mode="single"
                value={periodStart}
                onChange={setPeriodStart}
                required
                ariaLabel="Salary period start date"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-text-muted">End:</span>
              <DatePicker
                mode="single"
                value={periodEnd}
                onChange={setPeriodEnd}
                required
                ariaLabel="Salary period end date"
              />
            </div>
            <div className="w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <Card className="p-0 overflow-hidden">
            <DataTable
              columns={buildDynamicColumns(salaryQuery.data?.data)}
              data={salaryQuery.data?.data?.rows ?? []}
              isLoading={salaryQuery.isLoading || salaryQuery.isFetching}
              enablePagination={false}
              emptyMessage="No salary register records found."
            />
          </Card>
        </div>
      ),
    },
    {
      value: 'attendance',
      label: 'Attendance Register',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('attendance')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-text-muted">Period (YYYY-MM):</span>
              <Input type="month" value={attendancePeriod} onChange={(e) => setAttendancePeriod(e.target.value)} className="w-40" />
            </div>
            <div className="w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <Card className="p-0 overflow-hidden">
            <DataTable
              columns={buildDynamicColumns(attendanceQuery.data?.data)}
              data={attendanceQuery.data?.data?.rows ?? []}
              isLoading={attendanceQuery.isLoading || attendanceQuery.isFetching}
              enablePagination={false}
              emptyMessage="No attendance records found for this period."
            />
          </Card>
        </div>
      ),
    },
    {
      value: 'leave',
      label: 'Leave Balance',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('leave')}>
          <div className="flex items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <Card className="p-0 overflow-hidden">
            <DataTable
              columns={buildDynamicColumns(leaveQuery.data?.data)}
              data={leaveQuery.data?.data?.rows ?? []}
              isLoading={leaveQuery.isLoading || leaveQuery.isFetching}
              enablePagination={false}
              emptyMessage="No approved leave allocations found."
            />
          </Card>
        </div>
      ),
    },
    {
      value: 'contracts',
      label: 'Contract Expiry',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('contracts')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-text-muted">Expiring within (days):</span>
              <Select
                options={[
                  { value: '30', label: '30 Days' },
                  { value: '60', label: '60 Days' },
                  { value: '90', label: '90 Days' },
                  { value: '180', label: '180 Days' },
                ]}
                value={withinDays}
                onValueChange={setWithinDays}
              />
            </div>
            <div className="w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <Card className="p-0 overflow-hidden">
            <DataTable
              columns={buildDynamicColumns(expiryQuery.data?.data)}
              data={expiryQuery.data?.data?.rows ?? []}
              isLoading={expiryQuery.isLoading || expiryQuery.isFetching}
              enablePagination={false}
              emptyMessage="No contracts expiring within the selected window."
            />
          </Card>
        </div>
      ),
    },
    {
      value: 'dept',
      label: 'Department Cost',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('dept')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-text-muted">Start:</span>
              <DatePicker
                mode="single"
                value={periodStart}
                onChange={setPeriodStart}
                required
                ariaLabel="Department cost period start date"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-text-muted">End:</span>
              <DatePicker
                mode="single"
                value={periodEnd}
                onChange={setPeriodEnd}
                required
                ariaLabel="Department cost period end date"
              />
            </div>
          </div>
          <Card className="p-0 overflow-hidden">
            <DataTable
              columns={buildDynamicColumns(deptCostQuery.data?.data)}
              data={deptCostQuery.data?.data?.rows ?? []}
              isLoading={deptCostQuery.isLoading || deptCostQuery.isFetching}
              enablePagination={false}
              emptyMessage="No department cost records found."
            />
          </Card>
        </div>
      ),
    },
  ];

  if (user && !canAccessReports) {
    return (
      <>
        <PageHeader title="Reports" />
        <div className="p-8 text-center">
          <Card className="max-w-md mx-auto p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-danger">403 Forbidden</h2>
            <p className="text-body-sm text-text-muted">
              Only HR managers and payroll administrators can access reports.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Exportable HR and Payroll analytics"
        actions={
          <Button variant="secondary" onClick={handleExportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="px-5 pb-6">
        <Tabs items={tabItems} defaultValue="salary" />
      </div>
    </>
  );
}
