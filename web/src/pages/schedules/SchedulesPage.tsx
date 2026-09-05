import { Link } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function SchedulesPage() {
  return (
    <>
      <PageHeader title="Working schedules" actions={<Button variant="accent">New schedule</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3 text-right font-mono">Days / week</th>
                <th className="px-4 py-3 text-right font-mono">Hours / week</th>
                <th className="px-4 py-3 text-right font-mono">Employees</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '40 Hours / Week', days: 5, hours: '40.00', count: 28 },
                { name: 'Flexible Hybrid', days: 5, hours: '37.50', count: 6 },
                { name: 'Part-time 20h', days: 4, hours: '20.00', count: 5 },
                { name: 'Night Shift', days: 5, hours: '40.00', count: 3 },
              ].map((row) => (
                <tr key={row.name} className="border-b border-border hover:bg-primary-subtle">
                  <td className="px-4 py-3">
                    <Link to="/schedules/$id" params={{ id: 'new' }} className="text-accent no-underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{row.days}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.hours}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
