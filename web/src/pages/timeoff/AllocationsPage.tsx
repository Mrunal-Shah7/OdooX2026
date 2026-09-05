import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export default function AllocationsPage() {
  return (
    <>
      <PageHeader title="Allocations" actions={<Button variant="accent">New allocation</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right font-mono">Allocated</th>
                <th className="px-4 py-3 text-right font-mono">Taken</th>
                <th className="px-4 py-3 text-right font-mono">Remaining</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3">Paid Time Off</td>
                <td className="px-4 py-3 text-right font-mono">20.00</td>
                <td className="px-4 py-3 text-right font-mono">8.00</td>
                <td className="px-4 py-3 text-right font-mono">12.00</td>
                <td className="px-4 py-3"><Badge variant="success">approved</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
