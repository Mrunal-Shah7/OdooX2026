import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function StructureFormPage() {
  return (
    <>
      <PageHeader title="Regular Salary" subtitle="REGULAR · 12 rules" actions={<Button variant="accent">Save structure</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3 text-right font-mono">Seq</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Computation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { seq: 1, name: 'Basic', code: 'BASIC', cat: 'basic', comp: 'formula' },
                { seq: 10, name: 'HRA', code: 'HRA', cat: 'allowance', comp: 'percentage' },
                { seq: 110, name: 'Net Pay', code: 'NET', cat: 'net', comp: 'formula' },
              ].map((row) => (
                <tr key={row.code} className="border-b border-border">
                  <td className="px-4 py-3 text-right font-mono">{row.seq}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-caption">{row.code}</td>
                  <td className="px-4 py-3">{row.cat}</td>
                  <td className="px-4 py-3">{row.comp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
