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

type RuleItem = {
  id: string;
  name: string;
  code: string;
  sequence: number;
  category: string;
  structure?: { id: string; name: string };
};

export default function RulesPage() {
  const { user } = useSession();
  const canAccessPayroll = user && isPayrollRole(user.role);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiFetch<{ data: RuleItem[] }>('/payroll/rules'),
    enabled: !!canAccessPayroll,
  });

  const columns = useMemo<ColumnDef<RuleItem, any>[]>(
    () => [
      {
        id: 'structure',
        header: 'Structure',
        cell: (info) => info.row.original.structure?.name ?? '—',
      },
      {
        accessorKey: 'sequence',
        header: 'Seq',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => <span className="font-mono">{info.getValue()}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Rule',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      },
      {
        accessorKey: 'code',
        header: 'Code',
        meta: { code: true } as ColumnMeta,
        cell: (info) => <span className="font-mono text-caption">{info.getValue()}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: (info) => <span className="text-caption">{info.getValue()}</span>,
      },
    ],
    [],
  );

  if (user && !canAccessPayroll) {
    return (
      <>
        <PageHeader title="Salary rules" />
        <div className="p-8 text-center">
          <Card className="max-w-md mx-auto p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-danger">403 Forbidden</h2>
            <p className="text-body-sm text-text-muted">
              Only payroll administrators and payroll users can access salary rules.
            </p>
          </Card>
        </div>
      </>
    );
  }

  const rules = data?.data ?? [];

  return (
    <>
      <PageHeader title="Salary rules" actions={<Button variant="accent">New rule</Button>} />
      <PayrollNavTabs />
      <div className="px-5 pb-6">
        <Card className="p-0 overflow-hidden">
          {isError ? (
            <div className="p-6">
              <ErrorState message="Could not load salary rules" onRetry={() => refetch()} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rules}
              isLoading={isLoading}
              emptyMessage="No salary rules found."
            />
          )}
        </Card>
      </div>
    </>
  );
}
