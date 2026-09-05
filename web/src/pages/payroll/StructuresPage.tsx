import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { useSession } from '../../lib/session';
import { isPayrollRole } from '../../lib/permissions';
import { apiFetch } from '../../lib/apiFetch';

type StructureItem = {
  id: string;
  name: string;
  code: string;
  ruleCount?: number;
  employeeCount?: number;
};

export default function StructuresPage() {
  const { user } = useSession();
  const canAccessPayroll = user && isPayrollRole(user.role);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['structures'],
    queryFn: () => apiFetch<{ data: StructureItem[] }>('/payroll/structures'),
    enabled: !!canAccessPayroll,
  });

  const columns = useMemo<ColumnDef<StructureItem, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Structure',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      },
      {
        accessorKey: 'code',
        header: 'Code',
        meta: { code: true } as ColumnMeta,
        cell: (info) => <span className="font-mono text-caption">{info.getValue()}</span>,
      },
      {
        accessorKey: 'ruleCount',
        header: 'Rules',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => info.getValue() ?? 0,
      },
      {
        accessorKey: 'employeeCount',
        header: 'Employees',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => info.getValue() ?? 0,
      },
    ],
    [],
  );

  if (user && !canAccessPayroll) {
    return (
      <>
        <PageHeader title="Salary structures" />
        <div className="p-8 text-center">
          <Card className="max-w-md mx-auto p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-danger">403 Forbidden</h2>
            <p className="text-body-sm text-text-muted">
              Only payroll administrators and payroll users can access salary structures.
            </p>
          </Card>
        </div>
      </>
    );
  }

  const structures = data?.data ?? [];

  return (
    <>
      <PageHeader title="Salary structures" actions={<Button variant="accent">New structure</Button>} />
      <PayrollNavTabs />
      <div className="px-5 pb-6">
        <Card className="p-0 overflow-hidden">
          {isError ? (
            <div className="p-6">
              <ErrorState message="Could not load salary structures" onRetry={() => refetch()} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={structures}
              isLoading={isLoading}
              emptyMessage="No salary structures found."
            />
          )}
        </Card>
      </div>
    </>
  );
}
