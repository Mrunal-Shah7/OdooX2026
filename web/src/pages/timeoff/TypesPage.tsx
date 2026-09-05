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

type TimeOffTypeItem = {
  id: string;
  name: string;
  code: string;
  unit: 'days' | 'hours';
  requiresAllocation: boolean;
  isPaid: boolean;
  approvalRole: string;
  color: string;
  active: boolean;
};

type TypesResponse = {
  data: TimeOffTypeItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

async function fetchTypes(page: number, pageSize: number): Promise<TypesResponse> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/time-off/types?page=${page}&pageSize=${pageSize}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load time off types');
  }
  return res.json();
}

function formatRole(role: string): string {
  switch (role) {
    case 'hr_manager':
      return 'HR Manager';
    case 'hr_payroll_manager':
      return 'Payroll Manager';
    case 'hr_payroll_user':
      return 'Payroll User';
    case 'admin':
      return 'Admin';
    case 'employee':
      return 'Employee';
    default:
      return role;
  }
}

export default function TypesPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const canManage = user ? isHrManagerOrAbove(user.role) : false;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timeOff', 'types', page, pageSize],
    queryFn: () => fetchTypes(page, pageSize),
  });

  const baseColumns = useMemo<ColumnDef<TimeOffTypeItem>[]>(
    () => [
      {
        id: 'name',
        header: 'Type',
        accessorKey: 'name',
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Link
            to="/time-off/types/$id"
            params={{ id: row.original.id }}
            className="flex items-center gap-2 font-semibold text-accent no-underline hover:underline"
          >
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: row.original.color }}
            />
            <span>{row.original.name}</span>
          </Link>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Code',
        meta: { code: true, filterVariant: 'text' } as ColumnMeta,
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <span className="capitalize">{row.original.unit}</span>
        ),
      },
      {
        id: 'requiresAllocation',
        header: 'Allocation',
        accessorFn: (row) => (row.requiresAllocation ? 'Required' : 'Not required'),
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <span>{row.original.requiresAllocation ? 'Required' : 'Not required'}</span>
        ),
      },
      {
        id: 'isPaid',
        header: 'Paid',
        accessorFn: (row) => (row.isPaid ? 'Yes' : 'No'),
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <span>{row.original.isPaid ? 'Yes' : 'No'}</span>
        ),
      },
      {
        id: 'approvalRole',
        header: 'Approval',
        accessorFn: (row) => formatRole(row.approvalRole),
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <span>{formatRole(row.original.approvalRole)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) => (row.active ? 'active' : 'inactive'),
        meta: { filterVariant: 'text' } as ColumnMeta,
        cell: ({ row }) => (
          <Badge variant={row.original.active ? 'success' : 'neutral'}>
            {row.original.active ? 'active' : 'inactive'}
          </Badge>
        ),
      },
    ],
    [],
  );

  const actionColumn = useMemo<ColumnDef<TimeOffTypeItem>>(
    () => ({
      id: 'actions',
      header: 'Actions',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link to="/time-off/types/$id" params={{ id: row.original.id }}>
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

  const columns = useMemo(
    () => (canManage ? [...baseColumns, actionColumn] : baseColumns),
    [canManage, baseColumns, actionColumn],
  );

  return (
    <>
      <PageHeader
        title="Time off types"
        subtitle="Policies, not employee transactions"
        actions={
          canManage ? (
            <Button
              variant="accent"
              onClick={() =>
                navigate({ to: '/time-off/types/$id', params: { id: 'new' } })
              }
            >
              New type
            </Button>
          ) : undefined
        }
      />

      <TimeOffNavTabs />
      <div className="space-y-4 px-5 pb-6">
        {isError ? (
          <Card>
            <ErrorState message="Could not load time off types" onRetry={() => refetch()} />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              isLoading={isLoading}
              emptyMessage="No time off types have been configured yet."
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
