import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmployeeNavTabs } from '../../components/layout/EmployeeNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { apiFetch } from '../../lib/apiFetch';

type ScheduleRow = {
  id: string;
  name: string;
  timezone: string;
  daysPerWeek: number;
  hoursPerWeek: string;
  active: boolean;
  employeeCount: number;
};

export default function SchedulesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['schedules', 'list', page, pageSize, search],
    queryFn: () => {
      const q = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { q: search } : {}),
      });
      return apiFetch<{ data: ScheduleRow[]; meta: { page: number; pageSize: number; total: number } }>(
        `/working-schedules?${q.toString()}`,
      );
    },
  });

  const columns = useMemo<ColumnDef<ScheduleRow, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Schedule Name',
        cell: (info) => (
          <Link
            to="/schedules/$id"
            params={{ id: info.row.original.id }}
            className="font-medium text-accent hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      },
      {
        accessorKey: 'daysPerWeek',
        header: 'Days / week',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => <span className="font-mono">{info.getValue()}</span>,
      },
      {
        accessorKey: 'hoursPerWeek',
        header: 'Hours / week',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => <span className="font-mono">{info.getValue()}</span>,
      },
      {
        accessorKey: 'employeeCount',
        header: 'Assigned Employees',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => <span className="font-mono">{info.getValue() ?? 0}</span>,
      },
      {
        accessorKey: 'active',
        header: 'Status',
        meta: {
          filterVariant: 'select',
          filterOptions: [
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ],
        } as ColumnMeta,
        cell: (info) => (
          <Badge variant={info.getValue() ? 'success' : 'neutral'}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableColumnFilter: false,
        cell: (info) => (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: '/schedules/$id', params: { id: info.row.original.id } })}
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
        title="Working Schedules"
        subtitle="Weekly working hour patterns and shifts"
        actions={
          <Button variant="accent" onClick={() => navigate({ to: '/schedules/$id', params: { id: 'new' } })}>
            New schedule
          </Button>
        }
      />
      <EmployeeNavTabs />
      <div className="space-y-4 px-4 pb-6 sm:px-5">
        <Card className="p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={response?.data ?? []}
            isLoading={isLoading || isFetching}
            searchPlaceholder="Search schedules..."
            globalFilter={search}
            onGlobalFilterChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            manualPagination={true}
            manualFiltering={true}
            totalCount={response?.meta?.total ?? 0}
            pagination={{ pageIndex: page - 1, pageSize }}
            onPaginationChange={(newPag) => {
              if (typeof newPag === 'function') {
                setPage((prev) => newPag({ pageIndex: prev - 1, pageSize }).pageIndex + 1);
              } else {
                setPage(newPag.pageIndex + 1);
              }
            }}
            emptyMessage="No working schedules found."
          />
        </Card>
      </div>
    </>
  );
}
