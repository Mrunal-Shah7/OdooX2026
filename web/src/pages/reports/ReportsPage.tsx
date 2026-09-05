import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Amount } from '../../components/ui/Amount';
import { Card } from '../../components/ui/Card';

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" actions={<Button variant="secondary">Export CSV</Button>} />
      <div className="px-5 pb-6">
        <Tabs
          items={[
            {
              value: 'salary',
              label: 'Salary register',
              content: (
                <Card>
                  <table className="w-full border-collapse text-body-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3 text-right font-mono">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="px-4 py-3">Aarav Mehta</td>
                        <td className="px-4 py-3">Engineering</td>
                        <td className="px-4 py-3 text-right"><Amount value="68637.50" /></td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              ),
            },
            {
              value: 'attendance',
              label: 'Attendance register',
              content: <Card><p className="p-5 text-text-muted">August 2026 attendance grid stub.</p></Card>,
            },
            {
              value: 'leave',
              label: 'Leave balance',
              content: <Card><p className="p-5 text-text-muted">Allocated, taken and remaining by type.</p></Card>,
            },
            {
              value: 'contracts',
              label: 'Contract expiry',
              content: <Card><p className="p-5 text-text-muted">3 contracts ending in September 2026.</p></Card>,
            },
            {
              value: 'dept',
              label: 'Department cost',
              content: <Card><p className="p-5 text-text-muted">Headcount and salary cost per department.</p></Card>,
            },
          ]}
        />
      </div>
    </>
  );
}
