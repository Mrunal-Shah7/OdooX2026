import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

export type EmployeeListItem = {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail: string | null;
  phone: string | null;
  department: { id: string; name: string; code: string };
  jobPosition: string;
  workingSchedule: { id: string; name: string; hoursPerWeek: string };
  employeeType: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive';
  joiningDate: string;
  workLocation: string | null;
  bankName: string | null;
  bankAccountHolder: string | null;
  bankAccountLast4: string | null;
  bankIfsc: string | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
  } | null;
};

export type EmployeeListResponse = {
  data: EmployeeListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

import { getStoredAuthToken } from '../../lib/session';

async function fetchEmployees(params: {
  q?: string;
  departmentId?: string;
  status?: string;
  employeeType?: string;
  page?: number;
  pageSize?: number;
}): Promise<EmployeeListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.departmentId && params.departmentId !== 'all')
    query.set('departmentId', params.departmentId);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.employeeType && params.employeeType !== 'all')
    query.set('employeeType', params.employeeType);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const headers: Record<string, string> = {};
  const token = getStoredAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `/api/employees${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { headers, credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }
  return res.json();
}

export default function EmployeeDirectoryPage() {
  const [q, setQ] = useState('');
  const [departmentId, setDepartmentId] = useState('all');
  const [status, setStatus] = useState('all');
  const [employeeType, setEmployeeType] = useState('all');
  const [page, setPage] = useState(1);

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => apiClient.listDepartments(),
  });

  const queryParams = {
    ...(q ? { q } : {}),
    ...(departmentId !== 'all' ? { departmentId } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(employeeType !== 'all' ? { employeeType } : {}),
    page: String(page),
  };

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees.all(queryParams),
    queryFn: () =>
      fetchEmployees({
        q: q || undefined,
        departmentId: departmentId !== 'all' ? departmentId : undefined,
        status: status !== 'all' ? status : undefined,
        employeeType: employeeType !== 'all' ? employeeType : undefined,
        page,
        pageSize: 20,
      }),
  });

  const departments = departmentsQuery.data ?? [];
  const deptOptions = [
    { value: 'all', label: 'All departments' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const statusOptions = [
    { value: 'all', label: 'All status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All types' },
    { value: 'full_time', label: 'Full time' },
    { value: 'part_time', label: 'Part time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
  ];

  const employees = employeesQuery.data?.data ?? [];
  const meta = employeesQuery.data?.meta;
  const total = meta?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${total} ${total === 1 ? 'employee' : 'employees'} found`}
        actions={
          <Link to="/employees/$id" params={{ id: 'new' }}>
            <Button variant="accent">New employee</Button>
          </Link>
        }
      />
      <div className="space-y-4 px-5 pb-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            placeholder="Search employees..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="min-w-40 max-w-xs"
          />
          <Select
            options={deptOptions}
            value={departmentId}
            onValueChange={(val) => {
              setDepartmentId(val);
              setPage(1);
            }}
          />
          <Select
            options={statusOptions}
            value={status}
            onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
          />
          <Select
            options={typeOptions}
            value={employeeType}
            onValueChange={(val) => {
              setEmployeeType(val);
              setPage(1);
            }}
          />
        </div>

        <Card>
          {employeesQuery.isLoading ? (
            <Spinner />
          ) : employeesQuery.isError ? (
            <ErrorState onRetry={() => employeesQuery.refetch()} />
          ) : employees.length === 0 ? (
            <EmptyState
              message="No employees found matching the filters."
              action={
                <Link to="/employees/$id" params={{ id: 'new' }}>
                  <Button variant="accent">New employee</Button>
                </Link>
              }
            />
          ) : (
            <>
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Work email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-border hover:bg-primary-subtle"
                    >
                      <td className="px-4 py-3 font-semibold text-accent">
                        <Link
                          to="/employees/$id"
                          params={{ id: emp.id }}
                          className="text-accent no-underline hover:underline"
                        >
                          {emp.firstName} {emp.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-caption">
                        {emp.workEmail}
                      </td>
                      <td className="px-4 py-3">{emp.department.name}</td>
                      <td className="px-4 py-3">{emp.jobPosition}</td>
                      <td className="px-4 py-3 capitalize">
                        {emp.employeeType.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={emp.status === 'active' ? 'success' : 'neutral'}
                        >
                          {emp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3 text-body-sm">
                  <span className="text-text-muted">
                    Page {meta.page} of {meta.totalPages} ({meta.total} items)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </>
  );
}
