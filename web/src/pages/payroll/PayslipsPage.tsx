import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Amount } from '../../components/ui/Amount';
import { Card } from '../../components/ui/Card';

export default function PayslipsPage() {
  return (
    <>
      <PayrollNavTabs />
      <PageHeader title="Payslips" subtitle="Your payslip history" />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-right font-mono">Net</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-mono text-caption">July 2026</td>
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3 text-right"><Amount value="68637.50" /></td>
                <td className="px-4 py-3"><Badge variant="success">paid</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
