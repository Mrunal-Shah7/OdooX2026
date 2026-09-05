import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { TimeOffNavTabs } from '../../components/layout/TimeOffNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';

type AllocationItem = {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  timeOffType: {
    id: string;
    name: string;
    code: string;
    unit: 'days' | 'hours';
    color: string;
  };
  allocated: string;
  taken: string;
  remaining: string;
  validFrom: string;
  validTo: string;
  status: 'draft' | 'approved' | 'refused';
  description: string | null;
};

type AllocationsResponse = {
  data: AllocationItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

async function fetchAllocations(params: Record<string, string>): Promise<AllocationsResponse> {
  const searchParams = new URLSearchParams(params);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/time-off/allocations?${searchParams.toString()}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load allocations');
  }
  return res.json();
}

async function fetchEmployees(): Promise<{ id: string; firstName: string; lastName: string }[]> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch('/api/employees?pageSize=100', { headers, credentials: 'include' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

async function fetchTypes(): Promise<{ id: string; name: string }[]> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch('/api/time-off/types?pageSize=100', { headers, credentials: 'include' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

function getAllocationBadgeVariant(status: string) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'draft':
      return 'warning';
    case 'refused':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function AllocationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [status, setStatus] = useState('');

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: fetchEmployees,
  });

  const { data: types = [] } = useQuery({
    queryKey: ['timeOff', 'types', 'options'],
    queryFn: fetchTypes,
  });

  const queryParams: Record<string, string> = {
    page: String(page),
    pageSize: '20',
  };
  if (employeeId) queryParams['employeeId'] = employeeId;
  if (timeOffTypeId) queryParams['timeOffTypeId'] = timeOffTypeId;
  if (status) queryParams['status'] = status;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timeOff', 'allocations', queryParams],
    queryFn: () => fetchAllocations(queryParams),
  });

  return (
    <>
      <PageHeader
        title="Allocations"
        subtitle="A balance is available only once the allocation is approved"
        actions={
          <Button
            variant="accent"
            onClick={() =>
              navigate({ to: '/time-off/allocations/$id', params: { id: 'new' } })
            }
          >
            New allocation
          </Button>
        }
      />

      <TimeOffNavTabs />
      <div className="space-y-4 px-5 pb-6">

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              options={[
                { value: '', label: 'All employees' },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.firstName} ${e.lastName}`,
                })),
              ]}
              value={employeeId}
              onValueChange={(v) => {
                setEmployeeId(v);
                setPage(1);
              }}
            />
          </div>

          <div className="w-48">
            <Select
              options={[
                { value: '', label: 'All types' },
                ...types.map((t) => ({
                  value: t.id,
                  label: t.name,
                })),
              ]}
              value={timeOffTypeId}
              onValueChange={(v) => {
                setTimeOffTypeId(v);
                setPage(1);
              }}
            />
          </div>

          <div className="w-40">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'approved', label: 'Approved' },
                { value: 'refused', label: 'Refused' },
              ]}
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
          </div>
        </div>

        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : isError ? (
            <ErrorState message="Could not load allocations" onRetry={() => refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="No allocations"
              message="No allocations match your criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right font-mono">Allocated</th>
                    <th className="px-4 py-3 text-right font-mono">Taken</th>
                    <th className="px-4 py-3 text-right font-mono">Remaining</th>
                    <th className="px-4 py-3 font-mono">Valid from</th>
                    <th className="px-4 py-3 font-mono">Valid to</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        navigate({
                          to: '/time-off/allocations/$id',
                          params: { id: item.id },
                        })
                      }
                      className="cursor-pointer border-b border-border transition-colors hover:bg-primary-subtle"
                    >
                      <td className="px-4 py-3 font-medium text-text">
                        {item.employee.firstName} {item.employee.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ background: item.timeOffType.color }}
                          />
                          <span>{item.timeOffType.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {item.allocated}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {item.taken}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-text">
                        {item.remaining}
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {item.validFrom}
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {item.validTo}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getAllocationBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-border px-4">
                <Pagination
                  page={data.meta.page}
                  pageSize={data.meta.pageSize}
                  total={data.meta.total}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
