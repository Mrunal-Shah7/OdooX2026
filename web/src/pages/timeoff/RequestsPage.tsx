import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export default function RequestsPage() {
  return (
    <>
      <PageHeader title="Time off requests" actions={<Button variant="accent">New request</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3 text-right font-mono">Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3">Paid Time Off</td>
                <td className="px-4 py-3 font-mono text-caption">2026-07-10 – 2026-07-14</td>
                <td className="px-4 py-3 text-right font-mono">5.00 d</td>
                <td className="px-4 py-3"><Badge variant="success">approved</Badge></td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3">Sanjay Mehra</td>
                <td className="px-4 py-3">Paid Time Off</td>
                <td className="px-4 py-3 font-mono text-caption">2026-09-20 – 2026-09-22</td>
                <td className="px-4 py-3 text-right font-mono">3.00 d</td>
                <td className="px-4 py-3"><Badge variant="warning">to_approve</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
