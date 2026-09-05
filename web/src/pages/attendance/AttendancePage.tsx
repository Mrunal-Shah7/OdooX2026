import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export default function AttendancePage() {
  return (
    <>
      <PageHeader title="Attendance" subtitle="July – September 2026" />
      <div className="space-y-4 px-5 pb-6">
        <Input placeholder="Search by employee" className="max-w-xs" />
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check in</th>
                <th className="px-4 py-3">Check out</th>
                <th className="px-4 py-3 text-right font-mono">Hours</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3 font-mono text-caption">2026-09-03</td>
                <td className="px-4 py-3 font-mono text-caption">09:45</td>
                <td className="px-4 py-3 font-mono text-caption">18:00</td>
                <td className="px-4 py-3 text-right font-mono">8.25</td>
                <td className="px-4 py-3"><Badge variant="warning">late</Badge></td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3">Aarav Mehta</td>
                <td className="px-4 py-3 font-mono text-caption">2026-09-02</td>
                <td className="px-4 py-3">—</td>
                <td className="px-4 py-3">—</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3"><Badge variant="danger">absent</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
