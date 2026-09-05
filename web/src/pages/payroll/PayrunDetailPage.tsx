import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Amount } from '../../components/ui/Amount';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  payrollApi,
  type PayrunDetailResponse,
} from './payrollApi';

export default function PayrunDetailPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const [data, setData] = useState<PayrunDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    payrollApi
      .getPayrun(id)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!id) {
    return <div className="p-6 text-danger">Invalid pay run ID.</div>;
  }

  const payrun = data?.payrun;
  const payslips = data?.payslips || [];

  const handleCompute = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await payrollApi.computePayrun(id);
      setData(res);
      setSuccessMessage('Pay run computed successfully.');
    } catch (err: any) {
      setError(err.message || 'Compute failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await payrollApi.validatePayrun(id);
      setData(res);
      setSuccessMessage('Pay run validated and locked.');
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await payrollApi.markPayrunPaid(id);
      setData(res);
      setSuccessMessage('Pay run marked as paid.');
    } catch (err: any) {
      setError(err.message || 'Mark paid failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPayslips = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const results = await payrollApi.sendPayslips(id);
      const sentCount = results.filter((r) => r.sent).length;
      setSuccessMessage(`Payslip PDFs emailed to ${sentCount} employee(s).`);
      fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Send payslips failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
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
      <PayrollNavTabs />
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
                <Button variant="secondary" onClick={handleCompute} disabled={actionLoading}>
                  Re-compute
                </Button>
                <Button
                  variant="accent"
                  onClick={handleValidate}
                  disabled={actionLoading || blockingWarnings.length > 0}
                  title={blockingWarnings.length > 0 ? 'Fix blocking warnings before validating' : ''}
                >
                  {actionLoading ? 'Validating...' : 'Validate'}
                </Button>
              </>
            )}
            {payrun?.status === 'validated' && (
              <Button variant="accent" onClick={handleMarkPaid} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Mark paid'}
              </Button>
            )}
            {payrun?.status === 'paid' && (
              <Button variant="secondary" onClick={handleSendPayslips} disabled={actionLoading}>
                {actionLoading ? 'Sending...' : 'Send payslips'}
              </Button>
            )}
          </div>
        }
      />

      <div className="px-5 pb-6 space-y-4">
        {error && (
          <div className="rounded-md bg-danger-subtle p-3 text-body-sm text-danger border border-danger">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-success-subtle p-3 text-body-sm text-success border border-success">
            {successMessage}
          </div>
        )}

        {/* Warning Banners */}
        {blockingWarnings.length > 0 && (
          <div className="rounded-lg bg-danger-subtle border border-danger p-4 space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-danger text-body-sm">
              <span>⚠️ {blockingWarnings.length} Blocking Warning(s) — Validation Refused</span>
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
        <Card>
          {loading ? (
            <div className="p-8 text-center text-body-sm text-text-muted">Loading pay run details...</div>
          ) : (
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right font-mono">Worked days</th>
                  <th className="px-4 py-3 text-right font-mono">Basic</th>
                  <th className="px-4 py-3 text-right font-mono">Gross</th>
                  <th className="px-4 py-3 text-right font-mono">Net</th>
                  <th className="px-4 py-3">Warnings</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-text-muted">
                      No payslips found in this pay run. Click "Compute" to generate.
                    </td>
                  </tr>
                ) : (
                  payslips.map((ps) => {
                    const emp = ps.employee;
                    return (
                      <tr
                        key={ps.id}
                        onClick={() => navigate({ to: '/payroll/payslips/$id', params: { id: ps.id } })}
                        className={`border-b border-border hover:bg-primary-subtle/50 cursor-pointer transition-colors ${
                          ps.archived ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-text">
                          {emp?.firstName} {emp?.lastName} {ps.archived ? '(archived)' : ''}
                        </td>
                        <td className="px-4 py-3 text-text-muted">{emp?.departmentName || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono">{ps.workedDays}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          <Amount value={ps.basic} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <Amount value={ps.gross} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">
                          <Amount value={ps.net} />
                        </td>
                        <td className="px-4 py-3">
                          {ps.warnings && ps.warnings.length > 0 ? (
                            <span
                              className={`font-mono text-caption font-semibold ${
                                ps.warnings.some((w) => w.blocking) ? 'text-danger' : 'text-warning'
                              }`}
                            >
                              {ps.warnings.length} warning(s)
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {ps.archived ? (
                            <Badge variant="neutral">archived</Badge>
                          ) : (
                            getStatusBadge(ps.status)
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
