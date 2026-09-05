import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Amount } from '../../components/ui/Amount';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { payrollApi, type PayslipSummary } from './payrollApi';

export default function PayslipsPage() {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchPayslips = () => {
    setLoading(true);
    payrollApi
      .getPayslips()
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

  const getStatusBadge = (status: string, archived?: boolean) => {
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
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const filteredPayslips = payslips.filter((ps) => {
    const empName = `${ps.employee?.firstName || ''} ${ps.employee?.lastName || ''}`.toLowerCase();
    const dept = (ps.employee?.departmentName || '').toLowerCase();
    const matchesSearch =
      search === '' || empName.includes(search.toLowerCase()) || dept.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || ps.status === statusFilter || (statusFilter === 'done' && ps.status === 'done');

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PayrollNavTabs />
      <PageHeader
        title="Payslips"
        subtitle="Individual payslips history across all pay runs"
        actions={
          <div className="flex items-center space-x-3">
            <div className="w-64">
              <Input
                placeholder="Search employee or dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'computed', label: 'Computed' },
                  { value: 'done', label: 'Validated' },
                  { value: 'paid', label: 'Paid' },
                ]}
              />
            </div>
          </div>
        }
      />

      <div className="px-5 pb-6 space-y-4">
        {error && (
          <div className="rounded-md bg-danger-subtle p-3 text-body-sm text-danger border border-danger">
            {error}
          </div>
        )}

        <Card>
          {loading ? (
            <div className="p-8 text-center text-body-sm text-text-muted">Loading payslips...</div>
          ) : (
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Pay Run</th>
                  <th className="px-4 py-3 text-right font-mono">Worked Days</th>
                  <th className="px-4 py-3 text-right font-mono">Basic</th>
                  <th className="px-4 py-3 text-right font-mono">Gross</th>
                  <th className="px-4 py-3 text-right font-mono">Net Payable</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                      No payslips found. Create and process a Pay run to generate payslips.
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((ps) => (
                    <tr
                      key={ps.id}
                      onClick={() => navigate({ to: '/payroll/payslips/$id', params: { id: ps.id } })}
                      className={`border-b border-border hover:bg-primary-subtle/50 cursor-pointer transition-colors ${
                        ps.archived ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-text">
                        {ps.employee?.firstName} {ps.employee?.lastName}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{ps.employee?.departmentName || '—'}</td>
                      <td className="px-4 py-3 font-mono text-caption text-text-muted">
                        {ps.payrunName || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{ps.workedDays}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <Amount value={ps.basic} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <Amount value={ps.gross} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        <Amount value={ps.net} /> <span className="text-caption text-text-muted">{ps.currency}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(ps.status, ps.archived)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
