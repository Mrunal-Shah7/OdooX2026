import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Amount } from '../../components/ui/Amount';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { DatePicker } from '../../components/ui/DatePicker';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
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

type ReportResultsProps = {
  reportData?: ReportData;
  columns: ColumnDef<Record<string, string | null>, string>[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  emptyMessage: string;
};

function ReportValue({ column, value }: { column: ReportColumn; value: string | null }) {
  if (value === null || value === '') return <span>—</span>;
  if (column.type === 'money') return <Amount value={value} />;
  if (column.type === 'date') return <span className="font-mono text-caption">{value}</span>;
  if (column.type === 'number' || column.type === 'quantity') {
    return <span className="font-mono">{value}</span>;
  }
  return <span>{value}</span>;
}

function ReportResults({
  reportData,
  columns,
  isLoading,
  isError,
  onRetry,
  emptyMessage,
}: ReportResultsProps) {
  if (isError) {
    return (
      <Card className="p-5">
        <ErrorState message="Could not load this report" onRetry={onRetry} />
      </Card>
    );
  }

  if (!isLoading && (reportData?.rows.length ?? 0) === 0) {
    return (
      <Card className="p-5">
        <EmptyState message={emptyMessage} />
      </Card>
    );
  }

  return (
    <>
      <Card className="hidden overflow-hidden p-0 lg:block">
        <DataTable
          columns={columns}
          data={reportData?.rows ?? []}
          isLoading={isLoading}
          enablePagination={false}
          emptyMessage={emptyMessage}
        />
      </Card>

      <div className="space-y-3 lg:hidden">
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <Card key={index} className="space-y-3 p-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))
          : reportData?.rows.map((row, rowIndex) => (
              <Card key={rowIndex} className="p-4">
                <dl className="space-y-3">
                  {reportData.columns.map((column, columnIndex) => (
                    <div
                      key={column.key}
                      className={`grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-4 ${
                        columnIndex > 0 ? 'border-t border-border pt-3' : ''
                      }`}
                    >
                      <dt className="min-w-0 text-label text-text-muted">{column.label}</dt>
                      <dd className="min-w-0 break-words text-left text-body-sm text-text sm:text-right">
                        <ReportValue column={column} value={row[column.key] ?? null} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
      </div>
    </>
  );
}

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

  function buildDynamicColumns(reportData?: ReportData): ColumnDef<Record<string, string | null>, string>[] {
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
          const val = info.getValue();
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
            <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className="text-caption font-medium text-text-muted">Start:</span>
              <DatePicker
                mode="single"
                value={periodStart}
                onChange={setPeriodStart}
                required
                ariaLabel="Salary period start date"
              />
            </div>
            <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className="text-caption font-medium text-text-muted">End:</span>
              <DatePicker
                mode="single"
                value={periodEnd}
                onChange={setPeriodEnd}
                required
                ariaLabel="Salary period end date"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <ReportResults
            reportData={salaryQuery.data?.data}
            columns={buildDynamicColumns(salaryQuery.data?.data)}
            isLoading={salaryQuery.isLoading || salaryQuery.isFetching}
            isError={salaryQuery.isError}
            onRetry={() => void salaryQuery.refetch()}
            emptyMessage="No salary register records found."
          />
        </div>
      ),
    },
    {
      value: 'attendance',
      label: 'Attendance Register',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('attendance')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className="text-caption font-medium text-text-muted">Period (YYYY-MM):</span>
              <Input type="month" value={attendancePeriod} onChange={(e) => setAttendancePeriod(e.target.value)} className="w-full sm:w-40" />
            </div>
            <div className="w-full sm:w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <ReportResults
            reportData={attendanceQuery.data?.data}
            columns={buildDynamicColumns(attendanceQuery.data?.data)}
            isLoading={attendanceQuery.isLoading || attendanceQuery.isFetching}
            isError={attendanceQuery.isError}
            onRetry={() => void attendanceQuery.refetch()}
            emptyMessage="No attendance records found for this period."
          />
        </div>
      ),
    },
    {
      value: 'leave',
      label: 'Leave Balance',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('leave')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="w-full sm:w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <ReportResults
            reportData={leaveQuery.data?.data}
            columns={buildDynamicColumns(leaveQuery.data?.data)}
            isLoading={leaveQuery.isLoading || leaveQuery.isFetching}
            isError={leaveQuery.isError}
            onRetry={() => void leaveQuery.refetch()}
            emptyMessage="No approved leave allocations found."
          />
        </div>
      ),
    },
    {
      value: 'contracts',
      label: 'Contract Expiry',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('contracts')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center">
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
            <div className="w-full sm:w-48">
              <Select options={departmentOptions} value={departmentId} onValueChange={setDepartmentId} />
            </div>
          </div>
          <ReportResults
            reportData={expiryQuery.data?.data}
            columns={buildDynamicColumns(expiryQuery.data?.data)}
            isLoading={expiryQuery.isLoading || expiryQuery.isFetching}
            isError={expiryQuery.isError}
            onRetry={() => void expiryQuery.refetch()}
            emptyMessage="No contracts expiring within the selected window."
          />
        </div>
      ),
    },
    {
      value: 'dept',
      label: 'Department Cost',
      content: (
        <div className="space-y-4" onClick={() => setActiveTab('dept')}>
          <div className="flex flex-wrap items-center gap-3 bg-surface p-3 border border-border rounded-md">
            <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className="text-caption font-medium text-text-muted">Start:</span>
              <DatePicker
                mode="single"
                value={periodStart}
                onChange={setPeriodStart}
                required
                ariaLabel="Department cost period start date"
              />
            </div>
            <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center">
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
          <ReportResults
            reportData={deptCostQuery.data?.data}
            columns={buildDynamicColumns(deptCostQuery.data?.data)}
            isLoading={deptCostQuery.isLoading || deptCostQuery.isFetching}
            isError={deptCostQuery.isError}
            onRetry={() => void deptCostQuery.refetch()}
            emptyMessage="No department cost records found."
          />
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
      <div className="min-w-0 px-4 pb-6 sm:px-5">
        <Tabs items={tabItems} defaultValue="salary" className="reports-tabs" />
      </div>
    </>
  );
}
