import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';

type AttendanceItem = {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: string;
  overtimeHours: string;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';
  notes: string | null;
  isManualEdit: boolean;
};

type AttendanceListResponse = {
  data: AttendanceItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

async function fetchAttendance(params: Record<string, string>): Promise<AttendanceListResponse> {
  const searchParams = new URLSearchParams(params);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/attendance?${searchParams.toString()}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load attendance records');
  }
  return res.json();
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'present':
      return 'success';
    case 'late':
      return 'warning';
    case 'absent':
      return 'danger';
    case 'half_day':
      return 'info';
    case 'on_leave':
    default:
      return 'neutral';
  }
}

export default function AttendancePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as Record<string, string>;

  const [page, setPage] = useState(1);
  const [employeeIdFilter, setEmployeeIdFilter] = useState(searchParams?.['employeeId'] ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('2026-09-01');
  const [dateTo, setDateTo] = useState('2026-09-30');

  const queryParams: Record<string, string> = {
    page: String(page),
    pageSize: '20',
  };
  if (employeeIdFilter) queryParams['employeeId'] = employeeIdFilter;
  if (statusFilter) queryParams['status'] = statusFilter;
  if (dateFrom) queryParams['dateFrom'] = dateFrom;
  if (dateTo) queryParams['dateTo'] = dateTo;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance', queryParams],
    queryFn: () => fetchAttendance(queryParams),
  });

  const canCreate = user ? isHrManagerOrAbove(user.role) : false;

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="September 2026"
        actions={
          canCreate ? (
            <Button
              variant="accent"
              onClick={() => navigate({ to: '/attendance/$id', params: { id: 'new' } })}
            >
              New record
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4 px-5 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Input
              placeholder="Filter by Employee ID"
              value={employeeIdFilter}
              onChange={(e) => {
                setEmployeeIdFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-36">
            <Input
              type="text"
              placeholder="From (YYYY-MM-DD)"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-36">
            <Input
              type="text"
              placeholder="To (YYYY-MM-DD)"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'present', label: 'Present' },
                { value: 'late', label: 'Late' },
                { value: 'absent', label: 'Absent' },
                { value: 'half_day', label: 'Half day' },
                { value: 'on_leave', label: 'On leave' },
              ]}
              value={statusFilter}
              onValueChange={(val: string) => {
                setStatusFilter(val);
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
            <ErrorState message="Could not load attendance records" onRetry={() => refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="No attendance records"
              message="No attendance records match your current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Check in</th>
                    <th className="px-4 py-3">Check out</th>
                    <th className="px-4 py-3 text-right font-mono">Worked hours</th>
                    <th className="px-4 py-3 text-right font-mono">Overtime</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Edited</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        navigate({ to: '/attendance/$id', params: { id: item.id } })
                      }
                      className="cursor-pointer border-b border-border transition-colors hover:bg-primary-subtle"
                    >
                      <td className="px-4 py-3 font-medium text-text">
                        {item.employee.firstName} {item.employee.lastName}
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {item.date}
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {formatTime(item.checkIn)}
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {formatTime(item.checkOut)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {item.workedHours}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {item.overtimeHours}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text-muted">
                        {item.isManualEdit ? 'manual' : ''}
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
