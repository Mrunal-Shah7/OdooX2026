import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function HolidaysPage() {
  return (
    <>
      <PageHeader title="Public holidays" actions={<Button variant="accent">Add holiday</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Holiday</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Republic Day', date: '2026-01-26' },
                { name: 'Teachers Day', date: '2026-09-05' },
                { name: 'Hindi Diwas', date: '2026-09-14' },
                { name: 'Gandhi Jayanti', date: '2026-10-02' },
              ].map((row) => (
                <tr key={row.date} className="border-b border-border">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-caption">{row.date}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" size="sm">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
