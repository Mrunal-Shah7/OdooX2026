import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Amount } from '../../components/ui/Amount';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';

type ContractRow = {
  id: string;
  reference: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  jobPosition: string;
  wage: string;
  currency: 'INR' | 'USD';
  status: 'draft' | 'running' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string | null;
};

import { EmployeeNavTabs } from '../../components/layout/EmployeeNavTabs';

export default function ContractsPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { employeeId?: string };

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.contracts.all({
      page: String(page),
      pageSize: String(pageSize),
      ...(searchParams.employeeId ? { employeeId: searchParams.employeeId } : {}),
    }),
    queryFn: () => {
      const q = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(searchParams.employeeId ? { employeeId: searchParams.employeeId } : {}),
      });
      return apiFetch<{ data: ContractRow[]; meta: { page: number; pageSize: number; total: number } }>(
        `/contracts?${q.toString()}`,
      );
    },
  });

  const columns = useMemo<ColumnDef<ContractRow, any>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: 'Reference',
        meta: { code: true } as ColumnMeta,
        cell: (info) => (
          <Link
            to="/contracts/$id"
            params={{ id: info.row.original.id }}
            className="font-mono text-caption font-medium text-accent hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      },
      {
        id: 'employeeName',
        accessorFn: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
        header: 'Employee',
        cell: (info) => (
          <div>
            <div className="font-medium text-text">{info.getValue()}</div>
            <div className="text-caption text-text-muted">{info.row.original.employee.workEmail}</div>
          </div>
        ),
      },
      {
        id: 'department',
        accessorFn: (row) => row.department.name,
        header: 'Department',
      },
      {
        accessorKey: 'jobPosition',
        header: 'Job Position',
      },
      {
        accessorKey: 'wage',
        header: 'Wage / month',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => (
          <Amount value={info.getValue()} currency={info.row.original.currency} />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: {
          filterVariant: 'select',
          filterOptions: [
            { label: 'Draft', value: 'draft' },
            { label: 'Running', value: 'running' },
            { label: 'Expired', value: 'expired' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        } as ColumnMeta,
        cell: (info) => {
          const status = info.getValue() as ContractRow['status'];
          const variantMap: Record<ContractRow['status'], 'warning' | 'success' | 'danger' | 'neutral'> = {
            draft: 'warning',
            running: 'success',
            expired: 'danger',
            cancelled: 'neutral',
          };
          return <Badge variant={variantMap[status] ?? 'neutral'}>{status}</Badge>;
        },
      },
      {
        id: 'actions',
        header: '',
        enableColumnFilter: false,
        cell: (info) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: '/contracts/$id', params: { id: info.row.original.id } })}
            >
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader
        title="Contracts"
        subtitle={searchParams.employeeId ? 'Filtered by selected employee' : 'All employee contracts'}
        actions={
          <Button variant="accent" onClick={() => navigate({ to: '/contracts/$id', params: { id: 'new' } })}>
            New contract
          </Button>
        }
      />
      <EmployeeNavTabs />
      <div className="space-y-4 px-5 pb-6">
        <Card className="p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={response?.data ?? []}
            isLoading={isLoading}
            totalCount={response?.meta?.total ?? 0}
            pagination={{ pageIndex: page - 1, pageSize }}
            onPaginationChange={(newPag) => {
              if (typeof newPag === 'function') {
                setPage((prev) => newPag({ pageIndex: prev - 1, pageSize }).pageIndex + 1);
              } else {
                setPage(newPag.pageIndex + 1);
              }
            }}
            emptyMessage="No contracts found."
          />
        </Card>
      </div>
    </>
  );
}
