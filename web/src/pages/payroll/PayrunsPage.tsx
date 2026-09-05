import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { PayrunWizard } from './PayrunWizard';

export default function PayrunsPage() {
  return (
    <>
      <PageHeader title="Pay runs" actions={<PayrunWizard />} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Pay run</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right font-mono">Payslips</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3">September 2026</td>
                <td className="px-4 py-3 font-mono text-caption">2026-09-01 – 2026-09-30</td>
                <td className="px-4 py-3 text-right font-mono">0</td>
                <td className="px-4 py-3"><Badge variant="neutral">draft</Badge></td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3">August 2026</td>
                <td className="px-4 py-3 font-mono text-caption">2026-08-01 – 2026-08-31</td>
                <td className="px-4 py-3 text-right font-mono">38</td>
                <td className="px-4 py-3"><Badge variant="info">validated</Badge></td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3">July 2026</td>
                <td className="px-4 py-3 font-mono text-caption">2026-07-01 – 2026-07-31</td>
                <td className="px-4 py-3 text-right font-mono">38</td>
                <td className="px-4 py-3"><Badge variant="success">paid</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
