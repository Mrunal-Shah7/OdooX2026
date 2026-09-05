import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function RulesPage() {
  return (
    <>
      <PageHeader title="Salary rules" actions={<Button variant="accent">New rule</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Structure</th>
                <th className="px-4 py-3 text-right font-mono">Seq</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Code</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3">Regular Salary</td>
                <td className="px-4 py-3 text-right font-mono">1</td>
                <td className="px-4 py-3">Basic</td>
                <td className="px-4 py-3 font-mono text-caption">BASIC</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
