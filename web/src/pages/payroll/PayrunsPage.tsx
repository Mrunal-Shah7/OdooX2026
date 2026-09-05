import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { PayrunWizard } from './PayrunWizard';
import { payrollApi, type Payrun } from './payrollApi';
import { useSession } from '../../lib/session';
import { isPayrollRole } from '../../lib/permissions';

export default function PayrunsPage() {
  const { user } = useSession();
  const canAccessPayroll = user && isPayrollRole(user.role);

  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayruns = () => {
    if (!canAccessPayroll) return;
    setLoading(true);
    payrollApi
      .getPayruns()
      .then((res: any) => {
        const list: Payrun[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setPayruns(list);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayruns();
  }, [canAccessPayroll]);

  const columns = useMemo<ColumnDef<Payrun, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Pay run',
        meta: { filterPlaceholder: 'Filter pay run...' } as ColumnMeta,
        cell: (info) => (
          <Link
            to="/payroll/payruns/$id"
            params={{ id: info.row.original.id }}
            className="font-medium text-text hover:text-accent no-underline"
          >
            {info.getValue()}
          </Link>
        ),
      },
      {
        accessorKey: 'salaryStructure.name',
        header: 'Structure',
        meta: { filterPlaceholder: 'Filter structure...' } as ColumnMeta,
        cell: (info) => info.row.original.salaryStructure?.name || '—',
      },
      {
        id: 'period',
        accessorFn: (row) => `${row.periodStart} – ${row.periodEnd}`,
        header: 'Period',
        meta: { code: true, filterPlaceholder: 'Filter period...' } as ColumnMeta,
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'payslipCount',
        header: 'Payslips',
        meta: { align: 'right', filterPlaceholder: 'Filter count...' } as ColumnMeta,
        cell: (info) => info.getValue() ?? 0,
      },
      {
        accessorKey: 'warningCount',
        header: 'Warnings',
        meta: { align: 'right', filterPlaceholder: 'Filter warnings...' } as ColumnMeta,
        cell: (info) => {
          const val = info.getValue() ?? 0;
          return val > 0 ? (
            <span className="font-mono text-warning font-semibold">{val}</span>
          ) : (
            <span className="font-mono text-text-muted">0</span>
          );
        },
      },
      {
        id: 'totalNet',
        accessorFn: (row) => `${row.payoutCurrency} ${row.totalNet || '0.00'}`,
        header: 'Total Net',
        meta: { align: 'right', filterPlaceholder: 'Filter amount...' } as ColumnMeta,
        cell: (info) => <span className="font-mono font-medium">{info.getValue()}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: {
          filterVariant: 'select',
          filterOptions: [
            { label: 'Draft', value: 'draft' },
            { label: 'Computed', value: 'computed' },
            { label: 'Validated', value: 'validated' },
            { label: 'Paid', value: 'paid' },
          ],
        } as ColumnMeta,
        cell: (info) => {
          const status = info.getValue() as Payrun['status'];
          switch (status) {
            case 'draft':
              return <Badge variant="warning">draft</Badge>;
            case 'computed':
              return <Badge variant="warning">computed</Badge>;
            case 'validated':
              return <Badge variant="info">validated</Badge>;
            case 'paid':
              return <Badge variant="success">paid</Badge>;
            default:
              return <Badge variant="neutral">{status}</Badge>;
          }
        },
      },
    ],
    [],
  );

  if (user && !canAccessPayroll) {
    return (
      <>
        <PageHeader title="Pay runs" />
        <div className="p-8 text-center">
          <Card className="max-w-md mx-auto p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-danger">403 Forbidden</h2>
            <p className="text-body-sm text-text-muted">
              Only payroll administrators and payroll users can access pay runs.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Pay runs"
        actions={<PayrunWizard onSuccess={fetchPayruns} />}
      />
      <PayrollNavTabs />

      <div className="px-5 pb-6">
        <Card className="p-0 overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchPayruns} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payruns}
              isLoading={loading}
              enableFiltering={true}
              emptyMessage="No pay runs found. Click 'New pay run' above to create one."
            />
          )}
        </Card>
      </div>
    </>
  );
}
