import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Amount } from '../../components/ui/Amount';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { payrollApi, type PayslipSummary } from './payrollApi';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchPayslips = (qStr?: string) => {
    setLoading(true);
    payrollApi
      .getPayslips({ q: qStr !== undefined ? qStr : search })
      .then((res: any) => {
        const list: PayslipSummary[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setPayslips(list);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const columns = useMemo<ColumnDef<PayslipSummary, any>[]>(
    () => [
      {
        id: 'employeeName',
        accessorFn: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim(),
        header: 'Employee',
        meta: { filterPlaceholder: 'Filter employee...' } as ColumnMeta,
        cell: (info) => {
          const ps = info.row.original;
          const name = info.getValue() || 'Employee';
          return (
            <Link
              to="/payroll/payslips/$id"
              params={{ id: ps.id }}
              className={`font-medium text-text hover:text-accent no-underline ${ps.archived ? 'opacity-50' : ''}`}
            >
              {name}
            </Link>
          );
        },
      },
      {
        accessorKey: 'employee.departmentName',
        header: 'Department',
        meta: { filterPlaceholder: 'Filter dept...' } as ColumnMeta,
        cell: (info) => info.getValue() || '—',
      },
      {
        accessorKey: 'payrunName',
        header: 'Pay Run',
        meta: { code: true, filterPlaceholder: 'Filter pay run...' } as ColumnMeta,
        cell: (info) => info.getValue() || '—',
      },
      {
        accessorKey: 'workedDays',
        header: 'Worked Days',
        meta: { align: 'right', filterPlaceholder: 'Filter days...' } as ColumnMeta,
        cell: (info) => info.getValue() ?? 0,
      },
      {
        accessorKey: 'basic',
        header: 'Basic',
        meta: { align: 'right', filterPlaceholder: 'Filter basic...' } as ColumnMeta,
        cell: (info) => <Amount value={info.getValue() ?? '0.00'} />,
      },
      {
        accessorKey: 'gross',
        header: 'Gross',
        meta: { align: 'right', filterPlaceholder: 'Filter gross...' } as ColumnMeta,
        cell: (info) => <Amount value={info.getValue() ?? '0.00'} />,
      },
      {
        id: 'net',
        accessorKey: 'net',
        header: 'Net Payable',
        meta: { align: 'right', filterPlaceholder: 'Filter net...' } as ColumnMeta,
        cell: (info) => {
          const ps = info.row.original;
          return (
            <span className="font-mono font-semibold">
              <Amount value={ps.net ?? '0.00'} /> <span className="text-caption text-text-muted">{ps.currency}</span>
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: {
          filterVariant: 'select',
          filterOptions: [
            { label: 'Draft', value: 'draft' },
            { label: 'Computed', value: 'computed' },
            { label: 'Validated', value: 'done' },
            { label: 'Paid', value: 'paid' },
          ],
        } as ColumnMeta,
        cell: (info) => {
          const ps = info.row.original;
          if (ps.archived) return <Badge variant="neutral">archived</Badge>;
          switch (ps.status) {
            case 'draft':
              return <Badge variant="warning">draft</Badge>;
            case 'computed':
              return <Badge variant="warning">computed</Badge>;
            case 'done':
              return <Badge variant="info">validated</Badge>;
            case 'paid':
              return <Badge variant="success">paid</Badge>;
            default:
              return <Badge variant="neutral">{ps.status}</Badge>;
          }
        },
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Payslips"
        subtitle="Individual payslips history across all pay runs"
      />
      <PayrollNavTabs />

      <div className="px-5 pb-6">
        <Card className="p-0 overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchPayslips} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payslips}
              isLoading={loading}
              searchPlaceholder="Search payslips..."
              globalFilter={search}
              onGlobalFilterChange={(val) => {
                setSearch(val);
                fetchPayslips(val);
              }}
              manualFiltering={true}
              emptyMessage="No payslips found. Create and process a Pay run to generate payslips."
            />
          )}
        </Card>
      </div>
    </>
  );
}
