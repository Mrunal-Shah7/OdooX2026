import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function TypesPage() {
  return (
    <>
      <PageHeader title="Time off types" actions={<Button variant="accent">New type</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Paid Time Off', code: 'PTO', unit: 'days', alloc: 'Required' },
                { name: 'Sick Leave', code: 'SICK', unit: 'days', alloc: 'Not required' },
                { name: 'Comp Off', code: 'COMP', unit: 'hours', alloc: 'Required' },
                { name: 'Unpaid Leave', code: 'UNPAID', unit: 'days', alloc: 'Not required' },
              ].map((row) => (
                <tr key={row.code} className="border-b border-border">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-caption">{row.code}</td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3">{row.alloc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
