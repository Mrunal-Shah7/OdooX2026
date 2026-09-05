import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Amount } from '../../components/ui/Amount';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export default function ContractsPage() {
  return (
    <>
      <PageHeader title="Contracts" subtitle="Filtered to Aarav Mehta" actions={<Button variant="accent">New contract</Button>} />
      <div className="space-y-4 px-5 pb-6">
        <div className="flex gap-3">
          <Input placeholder="Search contracts" className="max-w-xs" />
        </div>
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-right font-mono">Wage / month</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-mono text-caption">CON/2026/0042</td>
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3 text-right"><Amount value="85000.00" /></td>
                <td className="px-4 py-3"><Badge variant="success">running</Badge></td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-mono text-caption">CON/2025/0018</td>
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3 text-right"><Amount value="78000.00" /></td>
                <td className="px-4 py-3"><Badge variant="danger">expired</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
