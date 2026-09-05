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
  const { user } = useSession();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const canManage = user ? isHrManagerOrAbove(user.role) : false;

  const queryParams: Record<string, string> = {
    page: String(page),
    pageSize: String(pageSize),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timeOff', 'allocations', queryParams],
    queryFn: () => fetchAllocations(queryParams),
  });

  const baseColumns = useMemo<ColumnDef<AllocationItem>[]>(
    () => [
      {
        id: 'employee',
        header: 'Employee',
        accessorFn: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Link
            to="/time-off/allocations/$id"
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
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: row.original.timeOffType.color }}
            />
            <span>{row.original.timeOffType.name}</span>
          </span>
        ),
      },
      {
        accessorKey: 'allocated',
        header: 'Allocated',
        cell: ({ row }) =>
          row.original.timeOffType.code === 'UL' ? 'Unlimited' : row.original.allocated,
        meta: { align: 'right', code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'taken',
        header: 'Taken',
        meta: { align: 'right', code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'remaining',
        header: 'Remaining',
        cell: ({ row }) =>
          row.original.timeOffType.code === 'UL' ? (
            <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
              Unlimited
            </span>
          ) : (
            <span className="font-semibold">{row.original.remaining}</span>
          ),
        meta: { align: 'right', code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'validFrom',
        header: 'Valid from',
        meta: { code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'validTo',
        header: 'Valid to',
        meta: { code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Badge variant={getAllocationBadgeVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  const actionColumn = useMemo<ColumnDef<AllocationItem>>(
    () => ({
      id: 'actions',
      header: 'Actions',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to="/time-off/allocations/$id" params={{ id: row.original.id }}>
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              <Pencil className="size-3.5" />
              <span>{row.original.status === 'draft' ? 'Review' : 'Edit'}</span>
            </Button>
          </Link>
        </div>
      ),
    }),
    [],
  );

  const columns = useMemo(
    () => (canManage ? [...baseColumns, actionColumn] : baseColumns),
    [canManage, baseColumns, actionColumn],
  );

  return (
    <>
      <PageHeader
        title="Allocations"
        subtitle="A balance is available only once the allocation is approved"
        actions={
          canManage ? (
            <Button
              variant="accent"
              onClick={() =>
                navigate({ to: '/time-off/allocations/$id', params: { id: 'new' } })
              }
            >
              New allocation
            </Button>
          ) : undefined
        }
      />

      <TimeOffNavTabs />
      <div className="space-y-4 px-5 pb-6">

        {isError ? (
          <Card>
            <ErrorState message="Could not load allocations" onRetry={() => refetch()} />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              isLoading={isLoading}
              emptyMessage="No allocations match your criteria."
              manualPagination={true}
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
