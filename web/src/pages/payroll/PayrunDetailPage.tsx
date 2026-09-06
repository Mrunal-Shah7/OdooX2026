import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Amount } from '../../components/ui/Amount';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { PageSkeleton } from '../../components/ui/Skeleton';
import {
  payrollApi,
  type PayrunDetailResponse,
  type PayslipSummary,
} from './payrollApi';
import { showToast } from '../../lib/toast';

function getStatusBadge(status?: string) {
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
      return <Badge variant="neutral">{status || 'unknown'}</Badge>;
  }
}

export default function PayrunDetailPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const [data, setData] = useState<PayrunDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    payrollApi
      .getPayrun(id)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        showToast({ type: 'error', title: 'Error', message: err.message });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

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
              {name} {ps.archived ? '(archived)' : ''}
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
        accessorKey: 'workedDays',
        header: 'Worked days',
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
        accessorKey: 'net',
        header: 'Net',
        meta: { align: 'right', filterPlaceholder: 'Filter net...' } as ColumnMeta,
        cell: (info) => <Amount value={info.getValue() ?? '0.00'} />,
      },
      {
        id: 'warnings',
        accessorFn: (row) => (row.warnings && row.warnings.length > 0 ? `${row.warnings.length} warning(s)` : 'None'),
        header: 'Warnings',
        meta: { filterPlaceholder: 'Filter warnings...' } as ColumnMeta,
        cell: (info) => {
          const ps = info.row.original;
          if (ps.warnings && ps.warnings.length > 0) {
            return (
              <span
                className={`font-mono text-caption font-semibold ${
                  ps.warnings.some((w) => w.blocking) ? 'text-danger' : 'text-warning'
                }`}
              >
                {ps.warnings.length} warning(s)
              </span>
            );
          }
          return <span className="text-text-muted">—</span>;
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
          return getStatusBadge(ps.status);
        },
      },
    ],
    [],
  );

  if (!id) {
    return <div className="p-6 text-danger">Invalid pay run ID.</div>;
  }

  if (loading && !data) {
    return <PageSkeleton />;
  }

  const payrun = data?.payrun;
  const payslips = data?.payslips || [];

  const handleCompute = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await payrollApi.computePayrun(id);
      setData(res);
      const msg = 'Pay run computed successfully.';
      setSuccessMessage(msg);
      showToast({ type: 'success', title: 'Pay Run Computed', message: msg });
    } catch (err: any) {
      const errMsg = err.message || 'Compute failed';
      showToast({ type: 'error', title: 'Compute Failed', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await payrollApi.validatePayrun(id);
      setData(res);
      const msg = 'Pay run validated and locked.';
      setSuccessMessage(msg);
      showToast({ type: 'success', title: 'Pay Run Validated', message: msg });
    } catch (err: any) {
      const errMsg = err.message || 'Validation failed';
      showToast({ type: 'error', title: 'Validation Failed', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await payrollApi.markPayrunPaid(id);
      setData(res);
      const msg = 'Pay run marked as paid.';
      setSuccessMessage(msg);
      showToast({ type: 'success', title: 'Pay Run Paid', message: msg });
    } catch (err: any) {
      const errMsg = err.message || 'Mark paid failed';
      showToast({ type: 'error', title: 'Action Failed', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPayslips = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const results = await payrollApi.sendPayslips(id);
      const sentCount = results.filter((r) => r.sent).length;
      const msg = `Payslip PDFs emailed to ${sentCount} employee(s).`;
      setSuccessMessage(msg);
      showToast({ type: 'success', title: 'Payslips Sent', message: msg });
      fetchDetail();
    } catch (err: any) {
      const errMsg = err.message || 'Send payslips failed';
      showToast({ type: 'error', title: 'Send Failed', message: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  // Collect all warnings across payslips
  const allWarnings: { code: string; message: string; blocking: boolean; employeeName: string }[] = [];
  payslips.forEach((ps) => {
    if (!ps.archived && ps.warnings) {
      ps.warnings.forEach((w) => {
        allWarnings.push({
          ...w,
          employeeName: `${ps.employee?.firstName || ''} ${ps.employee?.lastName || ''}`.trim(),
        });
      });
    }
  });

  const blockingWarnings = allWarnings.filter((w) => w.blocking);
  const advisoryWarnings = allWarnings.filter((w) => !w.blocking);

  return (
    <>
      <PageHeader
        title={payrun?.name || 'Pay run processing'}
        subtitle={
          <div className="flex items-center space-x-3">
            {getStatusBadge(payrun?.status)}
            {payrun?.periodStart && (
              <span className="font-mono text-caption text-text-muted">
                {payrun.periodStart} to {payrun.periodEnd}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => navigate({ to: '/payroll/payruns' })}>
              Back to Pay runs
            </Button>
            {payrun?.status === 'draft' && (
              <Button variant="accent" onClick={handleCompute} disabled={actionLoading}>
                {actionLoading ? 'Computing...' : 'Compute'}
              </Button>
            )}
            {payrun?.status === 'computed' && (
              <>
                <Button variant="accent" onClick={handleValidate} disabled={actionLoading}>
                  {actionLoading ? 'Validating...' : 'Validate & Lock'}
                </Button>
                <Button variant="secondary" onClick={handleCompute} disabled={actionLoading}>
                  Re-compute
                </Button>
              </>
            )}
            {payrun?.status === 'validated' && (
              <>
                <Button variant="accent" onClick={handleMarkPaid} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Mark as Paid'}
                </Button>
                <Button variant="secondary" onClick={handleSendPayslips} disabled={actionLoading}>
                  Email Payslips
                </Button>
              </>
            )}
            {payrun?.status === 'paid' && (
              <Button variant="secondary" onClick={handleSendPayslips} disabled={actionLoading}>
                Email Payslips
              </Button>
            )}
          </div>
        }
      />
      <PayrollNavTabs />

      <div className="space-y-4 px-4 pb-6 sm:px-5">
        {successMessage && (
          <div className="flex flex-col gap-2 rounded-md border border-success bg-success-subtle p-3 text-body-sm text-success sm:flex-row sm:items-center sm:justify-between">
            <span>{successMessage}</span>
            <button
              className="text-caption text-text-muted hover:text-text"
              onClick={() => setSuccessMessage(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Blocking Warnings Box */}
        {blockingWarnings.length > 0 && (
          <div className="rounded-lg bg-danger-subtle border border-danger p-4 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-danger text-body-sm">
              <span>🛑 {blockingWarnings.length} Blocking Error(s) — Cannot Validate</span>
            </div>
            <ul className="list-disc list-inside text-body-sm text-danger space-y-1">
              {blockingWarnings.map((w, idx) => (
                <li key={idx}>
                  <strong>{w.employeeName}:</strong> {w.message} [{w.code}]
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Advisory Warnings Box */}
        {advisoryWarnings.length > 0 && (
          <div className="rounded-lg bg-warning-subtle border border-warning p-4 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-warning text-body-sm">
              <span>ℹ️ {advisoryWarnings.length} Advisory Warning(s)</span>
            </div>
            <ul className="list-disc list-inside text-body-sm text-warning space-y-1">
              {advisoryWarnings.map((w, idx) => (
                <li key={idx}>
                  <strong>{w.employeeName}:</strong> {w.message} [{w.code}]
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payslips Table Card */}
        <Card className="p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={payslips}
            isLoading={loading}
            enableFiltering={true}
            emptyMessage="No payslips found in this pay run. Click 'Compute' above to generate."
          />
        </Card>
      </div>
    </>
  );
}
