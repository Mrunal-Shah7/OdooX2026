import { Link } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const sampleEmployees = [
  { name: 'Aarav Mehta', email: 'aarav.mehta@peoplepay360.test', dept: 'Engineering', status: 'active' },
  { name: 'Sara Khan', email: 'sara.khan@oxp.test', dept: 'Finance', status: 'active' },
  { name: 'John Dsouza', email: 'john.dsouza@oxp.test', dept: 'Engineering', status: 'active' },
  { name: 'Maya Shah', email: 'maya.shah@oxp.test', dept: 'HR', status: 'active' },
];

export default function EmployeeDirectoryPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="38 active across 5 departments"
        actions={<Button variant="accent">New employee</Button>}
      />
      <div className="space-y-4 px-5 pb-6">
        <div className="flex flex-wrap items-end gap-3">
          <Input placeholder="Search employees" className="min-w-40 max-w-xs" />
          <Select
            options={[
              { value: 'all', label: 'All departments' },
              { value: 'fin', label: 'Finance' },
              { value: 'eng', label: 'Engineering' },
            ]}
            value="all"
          />
        </div>
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Work email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleEmployees.map((row) => (
                <tr key={row.email} className="border-b border-border hover:bg-primary-subtle">
                  <td className="px-4 py-3">
                    <Link to="/employees/$id" params={{ id: 'e0000000-0000-4000-8000-000000000001' }} className="font-semibold text-accent no-underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-caption">{row.email}</td>
                  <td className="px-4 py-3">{row.dept}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{row.status}</Badge>
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
