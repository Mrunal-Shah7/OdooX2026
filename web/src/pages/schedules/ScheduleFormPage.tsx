import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';

const days = [
  { day: 'Monday', start: '09:00', end: '18:00', break: '1.00', hours: '8.00' },
  { day: 'Tuesday', start: '09:00', end: '18:00', break: '1.00', hours: '8.00' },
  { day: 'Wednesday', start: '09:00', end: '18:00', break: '1.00', hours: '8.00' },
  { day: 'Thursday', start: '09:00', end: '18:00', break: '1.00', hours: '8.00' },
  { day: 'Friday', start: '09:00', end: '18:00', break: '1.00', hours: '8.00' },
];

export default function ScheduleFormPage() {
  return (
    <>
      <PageHeader
        title="40 Hours / Week"
        subtitle="5 days · 40.00 hours per week"
        actions={
          <>
            <Button variant="secondary">Cancel</Button>
            <Button variant="accent">Save schedule</Button>
          </>
        }
      />
      <div className="px-5 pb-6">
        <Card>
          <CardBody className="space-y-4">
            <Field label="Name"><Input defaultValue="40 Hours / Week" /></Field>
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3 text-right font-mono">Break</th>
                  <th className="px-4 py-3 text-right font-mono">Hours</th>
                </tr>
              </thead>
              <tbody>
                {days.map((row) => (
                  <tr key={row.day} className="border-b border-border">
                    <td className="px-4 py-3">{row.day}</td>
                    <td className="px-4 py-3 font-mono text-caption">{row.start}</td>
                    <td className="px-4 py-3 font-mono text-caption">{row.end}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.break}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
