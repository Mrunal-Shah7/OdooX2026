import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Amount } from '../../components/ui/Amount';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { Skeleton } from '../../components/ui/Skeleton';
import { payrollApi, type PayslipDetail, type PayslipLine } from './payrollApi';
import { showToast } from '../../lib/toast';

export default function PayslipDetailPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const [data, setData] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'contract' | 'payout'>('contract');

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    payrollApi
      .getPayslip(id)
      .then((res: any) => {
        setData(res?.data ? res.data : res);
      })
      .catch((err) => showToast({ type: 'error', title: 'Error', message: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!id) {
    return <div className="p-6 text-danger">Invalid payslip ID.</div>;
  }

  const ps = data?.payslip;
  const lines = data?.lines || [];
  const emp = ps?.employee;
  const contract = ps?.contract;

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this payslip?')) return;
    setArchiving(true);
    try {
      await payrollApi.archivePayslip(id);
      showToast({ type: 'success', title: 'Payslip Archived', message: 'Payslip archived successfully.' });
      fetchDetail();
    } catch (err: any) {
      const msg = err.message || 'Archive failed';
      showToast({ type: 'error', title: 'Archive Failed', message: msg });
    } finally {
      setArchiving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const blob = await payrollApi.downloadPayslipPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${emp?.firstName || 'Employee'}_${emp?.lastName || ''}_${ps?.periodStart || 'period'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: 'PDF Downloaded', message: 'Payslip PDF generated.' });
    } catch (err: any) {
      const msg = err.message || 'Failed to download PDF';
      showToast({ type: 'error', title: 'Download Failed', message: msg });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status?: string, archived?: boolean) => {
    if (archived) return <Badge variant="neutral">archived</Badge>;
    switch (status) {
      case 'draft':
        return <Badge variant="warning">draft</Badge>;
      case 'computed':
        return <Badge variant="warning">computed</Badge>;
      case 'done':
        return <Badge variant="info">validated</Badge>;
      case 'paid':
        return <Badge variant="success">paid</Badge>;
      default:
        return <Badge variant="neutral">{status || 'unknown'}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'basic':
        return <Badge variant="neutral">basic</Badge>;
      case 'allowance':
        return <Badge variant="info">allowance</Badge>;
      case 'gross':
        return <Badge variant="warning">gross</Badge>;
      case 'deduction':
        return <Badge variant="danger">deduction</Badge>;
      case 'net':
        return <Badge variant="success">net</Badge>;
      default:
        return <Badge variant="neutral">{category}</Badge>;
    }
  };

  // Convert amount between contract currency and payout currency if requested
  const formatConverted = (amountStr: string) => {
    if (!ps) return amountStr;
    if (displayCurrency === 'payout' && ps.currency !== ps.payoutCurrency) {
      const rate = Number(ps.exchangeRate || '1');
      const val = Number(amountStr || '0') * rate;
      return val.toFixed(2);
    }
    return amountStr;
  };

  const currentCurrencySymbol =
    displayCurrency === 'payout' && ps?.payoutCurrency ? ps.payoutCurrency : ps?.currency || 'INR';

  const lineColumns = useMemo<ColumnDef<PayslipLine, any>[]>(
    () => [
      {
        accessorKey: 'sequence',
        header: 'Seq',
        meta: { code: true, filterPlaceholder: 'Filter seq...' } as ColumnMeta,
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'ruleCode',
        header: 'Rule Code',
        meta: { code: true, filterPlaceholder: 'Filter code...' } as ColumnMeta,
        cell: (info) => <span className="font-medium text-text">{info.getValue()}</span>,
      },
      {
        accessorKey: 'ruleName',
        header: 'Rule Name',
        meta: { filterPlaceholder: 'Filter rule...' } as ColumnMeta,
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        meta: {
          filterVariant: 'select',
          filterOptions: [
            { label: 'Basic', value: 'basic' },
            { label: 'Allowance', value: 'allowance' },
            { label: 'Gross', value: 'gross' },
            { label: 'Deduction', value: 'deduction' },
            { label: 'Net', value: 'net' },
          ],
        } as ColumnMeta,
        cell: (info) => getCategoryBadge(info.getValue()),
      },
      {
        accessorKey: 'amount',
        header: `Amount (${currentCurrencySymbol})`,
        meta: { align: 'right', filterPlaceholder: 'Filter amount...' } as ColumnMeta,
        cell: (info) => (
          <span className="font-mono font-semibold">
            <Amount value={formatConverted(info.getValue() ?? '0.00')} />
          </span>
        ),
      },
    ],
    [displayCurrency, ps],
  );

  return (
    <>
      <PageHeader
        title={emp ? `Payslip · ${emp.firstName} ${emp.lastName}` : 'Payslip detail'}
        subtitle={
          <div className="flex items-center space-x-3">
            {getStatusBadge(ps?.status, ps?.archived)}
            {ps && (
              <span className="font-mono text-caption text-text-muted">
                {ps.periodStart} to {ps.periodEnd} ({ps.payrunName})
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => navigate({ to: '/payroll/payslips' })}>
              Back to Payslips
            </Button>
            {ps && ps.currency !== ps.payoutCurrency && (
              <Button
                variant="secondary"
                onClick={() => setDisplayCurrency(displayCurrency === 'contract' ? 'payout' : 'contract')}
              >
                Switch to {displayCurrency === 'contract' ? ps.payoutCurrency : ps.currency}
              </Button>
            )}
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
            {ps && !ps.archived && (
              <Button variant="danger" onClick={handleArchive} disabled={archiving}>
                {archiving ? 'Archiving...' : 'Archive'}
              </Button>
            )}
          </div>
        }
      />
      <PayrollNavTabs />

      <div className="px-5 pb-6 space-y-4">
        {loading ? (
          <Skeleton className="skeleton--panel" />
        ) : !ps ? (
          <div className="p-8 text-center text-body-sm text-danger">Payslip not found.</div>
        ) : (
          <>
            {/* Warnings Alert Box */}
            {ps.warnings && ps.warnings.length > 0 && (
              <div className="rounded-lg bg-warning-subtle border border-warning p-4 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-warning text-body-sm">
                  <span>⚠️ Payslip Warnings ({ps.warnings.length})</span>
                </div>
                <ul className="list-disc list-inside text-body-sm text-warning space-y-1">
                  {ps.warnings.map((w, idx) => (
                    <li key={idx}>
                      <strong>{w.code}:</strong> {w.message} {w.blocking ? '(Blocking)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Header Details Card */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader title="Employee & Contract Details" />
                <CardBody className="space-y-2 text-body-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Employee Name</span>
                    <span className="font-medium text-text">{emp?.firstName} {emp?.lastName}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Work Email</span>
                    <span className="font-mono text-caption text-text">{emp?.workEmail}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Department</span>
                    <span className="text-text">{emp?.departmentName || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Job Position</span>
                    <span className="text-text">{emp?.jobPosition || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Contract Reference</span>
                    <span className="font-mono text-caption text-text">{contract?.reference || 'N/A'}</span>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Worked Days & Proration Breakdown" />
                <CardBody className="space-y-2 text-body-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Scheduled Working Days</span>
                    <span className="font-mono text-text">{ps.scheduledDays} days</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Worked Days (Present + Paid Leave)</span>
                    <span className="font-mono font-medium text-text">{ps.workedDays} days</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Paid / Unpaid Leave</span>
                    <span className="font-mono text-text">{ps.paidLeaveDays} paid / {ps.unpaidLeaveDays} unpaid</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-text-muted">Absent Days / Overtime</span>
                    <span className="font-mono text-text">{ps.absentDays} abs / {ps.overtimeHours} hrs OT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Proration Ratio</span>
                    <span className="font-mono font-bold text-accent">
                      {(Number(ps.proration) * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Financial Totals Summary Card */}
            <Card>
              <CardHeader
                title="Financial Summary"
                subtitle={`Values in ${currentCurrencySymbol} ${ps.currency !== ps.payoutCurrency ? `(Fx: ${ps.exchangeRate})` : ''}`}
              />
              <CardBody className="grid grid-cols-4 gap-4 font-mono text-body-sm">
                <div>
                  <span className="text-text-muted">Basic Salary</span>
                  <p className="m-0 text-title-sm font-semibold">
                    <Amount value={formatConverted(ps.basic)} />
                  </p>
                </div>
                <div>
                  <span className="text-text-muted">Gross Earnings</span>
                  <p className="m-0 text-title-sm font-semibold text-warning">
                    <Amount value={formatConverted(ps.gross)} />
                  </p>
                </div>
                <div>
                  <span className="text-text-muted">Total Deductions</span>
                  <p className="m-0 text-title-sm font-semibold text-danger">
                    <Amount value={formatConverted(ps.totalDeductions)} />
                  </p>
                </div>
                <div>
                  <span className="text-text-muted">Net Payable Salary</span>
                  <p className="m-0 text-title-md font-bold text-success">
                    <Amount value={formatConverted(ps.net)} /> {currentCurrencySymbol}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Computation Lines Card */}
            <Card className="p-0 overflow-hidden">
              <CardHeader title="Salary Rules Breakdown (Sequence Execution Order)" />
              <DataTable
                columns={lineColumns}
                data={lines}
                isLoading={false}
                enableFiltering={true}
                emptyMessage="No computation lines found. Click 'Compute' on the pay run to execute salary rules."
              />
            </Card>
          </>
        )}
      </div>
    </>
  );
}
