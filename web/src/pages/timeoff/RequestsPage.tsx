import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';

type TimeOffRequestItem = {
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
  startDate: string;
  endDate: string;
  durationType: 'full_day' | 'half_day' | 'hours';
  requestedHours: string | null;
  durationDays: string;
  durationHours: string;
  status: 'to_approve' | 'approved' | 'refused' | 'cancelled';
  reason: string | null;
};

type RequestsResponse = {
  data: TimeOffRequestItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

async function fetchRequests(params: Record<string, string>): Promise<RequestsResponse> {
  const searchParams = new URLSearchParams(params);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/time-off/requests?${searchParams.toString()}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load time off requests');
  }
  return res.json();
}

function getRequestBadgeVariant(status: string) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'to_approve':
      return 'warning';
    case 'refused':
      return 'danger';
    case 'cancelled':
    default:
      return 'neutral';
  }
}

function formatDurationLabel(type: string): string {
  switch (type) {
    case 'half_day':
      return 'Half day';
    case 'hours':
      return 'Hours';
    case 'full_day':
    default:
      return 'Full day';
  }
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams: Record<string, string> = {
    page: String(page),
    pageSize: '20',
  };
  if (statusFilter) queryParams['status'] = statusFilter;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timeOff', 'requests', queryParams],
    queryFn: () => fetchRequests(queryParams),
  });

  return (
    <>
      <PageHeader
        title="Time off requests"
        actions={
          <Button
            variant="accent"
            onClick={() =>
              navigate({ to: '/time-off/requests/$id', params: { id: 'new' } })
            }
          >
            New request
          </Button>
        }
      />

      <div className="space-y-4 px-5 pb-6">
        <div className="flex gap-4 border-b border-border text-label">
          <Link
            to="/time-off"
            className="pb-2 font-medium text-text-muted no-underline hover:text-text"
          >
            Overview
          </Link>
          <Link
            to="/time-off/requests"
            className="border-b-2 border-accent pb-2 font-semibold text-accent no-underline"
          >
            Requests
          </Link>
          <Link
            to="/time-off/allocations"
            className="pb-2 font-medium text-text-muted no-underline hover:text-text"
          >
            Allocations
          </Link>
          <Link
            to="/time-off/types"
            className="pb-2 font-medium text-text-muted no-underline hover:text-text"
          >
            Types
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'to_approve', label: 'To approve' },
                { value: 'approved', label: 'Approved' },
                { value: 'refused', label: 'Refused' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={statusFilter}
              onValueChange={(v: string) => {
                setStatusFilter(v);
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
            <ErrorState message="Could not load requests" onRetry={() => refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="No requests"
              message="No time off requests match your criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-right font-mono">Days</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        navigate({
                          to: '/time-off/requests/$id',
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
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {item.startDate}
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {item.endDate}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatDurationLabel(item.durationType)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {item.durationDays}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getRequestBadgeVariant(item.status)}>
                          {item.status.replace('_', ' ')}
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
