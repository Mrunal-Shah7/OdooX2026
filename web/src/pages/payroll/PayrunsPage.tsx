import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PayrunWizard } from './PayrunWizard';
import { payrollApi, type Payrun } from './payrollApi';
import { useSession } from '../../lib/session';
import { isPayrollRole } from '../../lib/permissions';

export default function PayrunsPage() {
  const navigate = useNavigate();
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

  const getStatusBadge = (status: Payrun['status']) => {
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
  };

  return (
    <>
      <PayrollNavTabs />
      <PageHeader
        title="Pay runs"
        actions={<PayrunWizard onSuccess={fetchPayruns} />}
      />

      <div className="px-5 pb-6">
        <Card>
          {error && (
            <div className="p-4 text-body-sm text-danger border-b border-border">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-body-sm text-text-muted">
              Loading pay runs...
            </div>
          ) : payruns.length === 0 ? (
            <div className="p-8 text-center text-body-sm text-text-muted">
              No pay runs found. Click "New pay run" above to create one.
            </div>
          ) : (
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Pay run</th>
                  <th className="px-4 py-3">Structure</th>
                  <th className="px-4 py-3 font-mono">Period</th>
                  <th className="px-4 py-3 text-right font-mono">Payslips</th>
                  <th className="px-4 py-3 text-right font-mono">Warnings</th>
                  <th className="px-4 py-3 text-right font-mono">Total Net</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payruns.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate({ to: '/payroll/payruns/$id', params: { id: pr.id } })}
                    className="border-b border-border hover:bg-primary-subtle/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text">{pr.name}</td>
                    <td className="px-4 py-3 text-text-muted">{pr.salaryStructure?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-caption text-text-muted">
                      {pr.periodStart} – {pr.periodEnd}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{pr.payslipCount}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {pr.warningCount > 0 ? (
                        <span className="text-warning font-semibold">{pr.warningCount}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {pr.payoutCurrency} {pr.totalNet || '0.00'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(pr.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
