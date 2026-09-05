import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function StructuresPage() {
  return (
    <>
      <PageHeader title="Salary structures" actions={<Button variant="accent">New structure</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Structure</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3 text-right font-mono">Rules</th>
                <th className="px-4 py-3 text-right font-mono">Employees</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Regular Salary', code: 'REGULAR', rules: 12, employees: 30 },
                { name: 'Intern Salary', code: 'INTERN', rules: 8, employees: 3 },
                { name: 'Contractor', code: 'CONTRACT', rules: 6, employees: 4 },
              ].map((row) => (
                <tr key={row.code} className="border-b border-border">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-caption">{row.code}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.rules}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.employees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
