import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatWorkedHours } from '../../lib/format';
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
    return new Date(isoStr).toLocaleTimeString('en-IN', {
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
    case 'on_leave':
      return 'info';
    default:
      return 'neutral';
  }
}

export default function AttendancePage() {
  const { user } = useSession();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const canCreate = user ? isHrManagerOrAbove(user.role) : false;

  const queryParams: Record<string, string> = {
    page: String(page),
    pageSize: String(pageSize),
  };
  if (search) {
    queryParams.q = search;
  }
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['attendance', 'list', queryParams],
    queryFn: () => fetchAttendance(queryParams),
  });

  const summary = useMemo(() => {
    const records = data?.data ?? [];
    return {
      total: data?.meta.total ?? 0,
      present: records.filter((record) => record.status === 'present').length,
      late: records.filter((record) => record.status === 'late').length,
      workedHours: records
        .reduce((total, record) => total + Number(record.workedHours), 0)
        .toFixed(2),
    };
  }, [data]);

  const baseColumns = useMemo<ColumnDef<AttendanceItem>[]>(
    () => [
      {
        id: 'employee',
        header: 'Employee',
        accessorFn: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Link
            to="/attendance/$id"
            params={{ id: row.original.id }}
            className="font-medium text-text no-underline hover:text-accent"
          >
            {row.original.employee.firstName} {row.original.employee.lastName}
          </Link>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        meta: { code: true, filterVariant: 'date' } as ColumnMeta,
      },
      {
        id: 'checkIn',
        header: 'Check in',
        accessorFn: (row) => formatTime(row.checkIn),
        meta: { code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        id: 'checkOut',
        header: 'Check out',
        accessorFn: (row) => formatTime(row.checkOut),
        meta: { code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'workedHours',
        header: 'Worked hours',
        meta: { align: 'right', filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => formatWorkedHours(row.original.workedHours),
      },
      {
        accessorKey: 'overtimeHours',
        header: 'Overtime',
        meta: { align: 'right', filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
    ],
    [],
  );

  const actionColumn = useMemo<ColumnDef<AttendanceItem>>(
    () => ({
      id: 'actions',
      header: 'Actions',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to="/attendance/$id" params={{ id: row.original.id }}>
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              <Pencil className="size-3.5" />
              <span>Edit</span>
            </Button>
          </Link>
        </div>
      ),
    }),
    [],
  );

  const canManage = user ? isHrManagerOrAbove(user.role) : false;
  const columns = useMemo(
    () => (canManage ? [...baseColumns, actionColumn] : baseColumns),
    [canManage, baseColumns, actionColumn],
  );

  return (
    <div className="attendance-page">
      <PageHeader
        title="Attendance records"
        subtitle="Review daily work hours, overtime, and attendance status."
        actions={
          canCreate ? (
            <Button
              variant="accent"
              onClick={() =>
                navigate({ to: '/attendance/$id', params: { id: 'new' } })
              }
            >
              Log attendance
            </Button>
          ) : undefined
        }
      />

      <div className="attendance-page__content">
        {!isError ? (
          <section className="attendance-summary" aria-label="Attendance summary">
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Total records</span>
              <strong className="attendance-summary__value">
                {isLoading ? '—' : summary.total}
              </strong>
              <span className="attendance-summary__note">All matching records</span>
            </div>
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Present</span>
              <strong className="attendance-summary__value">
                {isLoading ? '—' : summary.present}
              </strong>
              <span className="attendance-summary__note">On this page</span>
            </div>
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Late arrivals</span>
              <strong className="attendance-summary__value">
                {isLoading ? '—' : summary.late}
              </strong>
              <span className="attendance-summary__note">On this page</span>
            </div>
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Worked hours</span>
              <strong className="attendance-summary__value">
                {isLoading ? '—' : summary.workedHours}
              </strong>
              <span className="attendance-summary__note">Visible records</span>
            </div>
          </section>
        ) : null}

        {isError ? (
          <Card>
            <ErrorState message="Could not load attendance records" onRetry={() => refetch()} />
          </Card>
        ) : (
          <Card key={page} className="attendance-table-card overflow-hidden">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              isLoading={isLoading || isFetching}
              emptyMessage="No attendance records found."
              searchPlaceholder="Search attendance records..."
              globalFilter={search}
              onGlobalFilterChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              manualPagination={true}
              manualFiltering={true}
              totalCount={data?.meta?.total ?? 0}
              pageCount={data?.meta ? Math.ceil(data.meta.total / pageSize) : 1}
              pagination={{
                pageIndex: page - 1,
                pageSize,
              }}
              onPaginationChange={(updater) => {
                const nextState =
                  typeof updater === 'function'
                    ? updater({ pageIndex: page - 1, pageSize })
                    : updater;
                setPage(nextState.pageIndex + 1);
              }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
