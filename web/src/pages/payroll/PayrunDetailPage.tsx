import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Amount } from '../../components/ui/Amount';
import { Card } from '../../components/ui/Card';

export default function PayrunDetailPage() {
  return (
    <>
      <PageHeader
        title="August 2026"
        subtitle={<Badge variant="info">validated</Badge>}
        actions={
          <>
            <Button variant="secondary">Compute</Button>
            <Button variant="accent">Mark paid</Button>
          </>
        }
      />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-right font-mono">Worked days</th>
                <th className="px-4 py-3 text-right font-mono">Gross</th>
                <th className="px-4 py-3 text-right font-mono">Net</th>
                <th className="px-4 py-3">Warnings</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3 text-right font-mono">21.00</td>
                <td className="px-4 py-3 text-right"><Amount value="80750.00" /></td>
                <td className="px-4 py-3 text-right"><Amount value="68637.50" /></td>
                <td className="px-4 py-3">—</td>
              </tr>
              <tr className="border-b border-border opacity-60">
                <td className="px-4 py-3">Sara Khan (archived)</td>
                <td className="px-4 py-3 text-right font-mono">22.00</td>
                <td className="px-4 py-3 text-right"><Amount value="90250.00" /></td>
                <td className="px-4 py-3 text-right"><Amount value="76712.50" /></td>
                <td className="px-4 py-3"><Badge variant="neutral">archived</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
