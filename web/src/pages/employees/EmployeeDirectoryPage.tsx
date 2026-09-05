import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ApiClientError } from '../../lib/apiClient';
import { useSession } from '../../lib/session';
import { useDebounce } from '../../hooks/useDebounce';

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

async function fetchEmployees(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<EmployeeListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const url = `/api/employees${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }
  return res.json();
}

async function deleteEmployee(id: string): Promise<void> {
  const res = await fetch(`/api/employees/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new ApiClientError(
      err?.error?.code ?? 'CONFLICT',
      err?.error?.message ?? 'Failed to delete employee',
    );
  }
}

import { EmployeeNavTabs } from '../../components/layout/EmployeeNavTabs';

export default function EmployeeDirectoryPage() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [deletingEmp, setDeletingEmp] = useState<EmployeeListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const employeesQuery = useQuery({
    queryKey: ['employees', { q: debouncedSearch, page }],
    queryFn: () =>
      fetchEmployees({
        q: debouncedSearch || undefined,
        page,
        pageSize: 10,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeletingEmp(null);
      setDeleteError(null);
    },
    onError: (err: unknown) => {
      setDeleteError(err instanceof ApiClientError ? err.message : 'Delete failed');
    },
  });

  const baseColumns: ColumnDef<EmployeeListItem>[] = [
    {
      accessorKey: 'firstName',
      header: 'Employee',
      meta: { filterVariant: 'text' },
      cell: ({ row }) => (
        <Link
          to="/employees/$id"
          params={{ id: row.original.id }}
          className="font-semibold text-accent no-underline hover:underline"
        >
          {row.original.firstName} {row.original.lastName}
        </Link>
      ),
    },
    {
      accessorKey: 'workEmail',
      header: 'Work email',
      meta: { code: true, filterVariant: 'text' },
    },
    {
      accessorKey: 'department.name',
      header: 'Department',
      meta: { filterVariant: 'text' },
      cell: ({ row }) => row.original.department.name,
    },
    {
      accessorKey: 'jobPosition',
      header: 'Position',
      meta: { filterVariant: 'text' },
    },
    {
      accessorKey: 'employeeType',
      header: 'Type',
      meta: { filterVariant: 'text' },
      cell: ({ row }) => (
        <span className="capitalize">{row.original.employeeType.replace('_', ' ')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { filterVariant: 'text' },
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'success' : 'neutral'}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const actionColumn: ColumnDef<EmployeeListItem> = {
    id: 'actions',
    header: 'Actions',
    enableColumnFilter: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link to="/employees/$id" params={{ id: row.original.id }}>
          <Button variant="secondary" size="sm" className="flex items-center gap-1">
            <Pencil className="size-3.5" />
            <span>Edit</span>
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setDeletingEmp(row.original);
            setDeleteError(null);
          }}
          className="flex items-center gap-1"
        >
          <Trash2 className="size-3.5" />
          <span>Delete</span>
        </Button>
      </div>
    ),
  };

  const columns = isAdmin ? [...baseColumns, actionColumn] : baseColumns;

  const employees = employeesQuery.data?.data ?? [];
  const meta = employeesQuery.data?.meta;
  const total = meta?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${total} ${total === 1 ? 'employee' : 'employees'} found`}
        actions={
          isAdmin ? (
            <Link to="/employees/$id" params={{ id: 'new' }}>
              <Button variant="accent" className="flex items-center gap-1.5">
                <Plus className="size-4" />
                <span>Create Employee</span>
              </Button>
            </Link>
          ) : undefined
        }
      />
      <EmployeeNavTabs />
      <div className="space-y-4 px-5 pb-6">
        <div className="flex items-center justify-between">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-2.5 size-4 text-text-muted" />
            <Input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
        <Card>
          <DataTable
            columns={columns}
            data={employees}
            isLoading={employeesQuery.isLoading}
            emptyMessage="No employees found."
            manualPagination={true}
            totalCount={total}
            pageCount={meta?.totalPages ?? 1}
            pagination={{
              pageIndex: page - 1,
              pageSize: 10,
            }}
            onPaginationChange={(updater) => {
              const nextState =
                typeof updater === 'function'
                  ? updater({ pageIndex: page - 1, pageSize: 10 })
                  : updater;
              setPage(nextState.pageIndex + 1);
            }}
          />
        </Card>
      </div>

      <Modal
        open={Boolean(deletingEmp)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEmp(null);
            setDeleteError(null);
          }
        }}
        title="Confirm Delete Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingEmp(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deletingEmp) deleteMutation.mutate(deletingEmp.id);
              }}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
            </Button>
          </>
        }
      >
        <p className="text-body-sm">
          Are you sure you want to delete employee{' '}
          <strong className="text-primary">
            {deletingEmp?.firstName} {deletingEmp?.lastName}
          </strong>
          ? This action cannot be undone.
        </p>
        {deleteError && <p className="mt-3 text-caption text-danger">{deleteError}</p>}
      </Modal>
    </>
  );
}
