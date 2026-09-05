import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { TimeOffNavTabs } from '../../components/layout/TimeOffNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';

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
  const { user } = useSession();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const canApprove = user ? isHrManagerOrAbove(user.role) : false;

  const queryParams: Record<string, string> = {
    page: String(page),
    pageSize: String(pageSize),
  };
  if (search) {
    queryParams.q = search;
  }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['timeOff', 'requests', queryParams],
    queryFn: () => fetchRequests(queryParams),
  });

  const baseColumns = useMemo<ColumnDef<TimeOffRequestItem>[]>(
    () => [
      {
        id: 'employee',
        header: 'Employee',
        accessorFn: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Link
            to="/time-off/requests/$id"
            params={{ id: row.original.id }}
            className="font-medium text-text no-underline hover:text-accent"
          >
            {row.original.employee.firstName} {row.original.employee.lastName}
          </Link>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        accessorFn: (row) => row.timeOffType.name,
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => {
          const isPending = row.original.status === 'to_approve';
          return (
          <span
            className={
              isPending
                ? 'flex w-fit items-center gap-1.5 rounded-sm bg-warning-subtle px-2 py-1 text-warning'
                : 'flex items-center gap-1.5'
            }
          >
            <span
              className={
                isPending
                  ? 'inline-block size-2.5 rounded-full bg-warning'
                  : 'inline-block size-2.5 rounded-full'
              }
              style={isPending ? undefined : { background: row.original.timeOffType.color }}
            />
            <span>{row.original.timeOffType.name}</span>
          </span>
          );
        },
      },
      {
        accessorKey: 'startDate',
        header: 'Start',
        meta: { code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'endDate',
        header: 'End',
        meta: { code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        id: 'durationType',
        header: 'Duration',
        accessorFn: (row) => formatDurationLabel(row.durationType),
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <span className="text-text-muted">
            {formatDurationLabel(row.original.durationType)}
          </span>
        ),
      },
      {
        accessorKey: 'durationDays',
        header: 'Days',
        meta: { align: 'right', filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Badge variant={getRequestBadgeVariant(row.original.status)}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
    ],
    [],
  );

  const actionColumn = useMemo<ColumnDef<TimeOffRequestItem>>(
    () => ({
      id: 'actions',
      header: 'Actions',
      enableColumnFilter: false,
      cell: ({ row }) => {
        const isReviewable = canApprove && row.original.status === 'to_approve';
        return (
          <div className="flex items-center gap-2">
            <Link to="/time-off/requests/$id" params={{ id: row.original.id }}>
              <Button variant="secondary" size="sm" className="flex items-center gap-1">
                <Pencil className="size-3.5" />
                <span>{isReviewable ? 'Review' : 'View'}</span>
              </Button>
            </Link>
          </div>
        );
      },
    }),
    [canApprove],
  );

  const columns = useMemo(
    () => [...baseColumns, actionColumn],
    [baseColumns, actionColumn],
  );

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

      <TimeOffNavTabs />
      <div className="space-y-4 px-5 pb-6">
        {isError ? (
          <Card>
            <ErrorState message="Could not load requests" onRetry={() => refetch()} />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              isLoading={isLoading || isFetching}
              emptyMessage="No time off requests match your criteria."
              searchPlaceholder="Search requests..."
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
    </>
  );
}
