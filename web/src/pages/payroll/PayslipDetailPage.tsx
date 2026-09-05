import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Amount } from '../../components/ui/Amount';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';

export default function PayslipDetailPage() {
  return (
    <>
      <PageHeader
        title="Payslip · July 2026"
        subtitle="Aarav Mehta"
        actions={
          <>
            <Button variant="secondary">Download PDF</Button>
            <Button variant="danger">Archive</Button>
          </>
        }
      />
      <div className="space-y-4 px-5 pb-6">
        <div className="flex gap-2">
          <Badge variant="success">paid</Badge>
          <span className="font-mono text-caption text-text-muted">INR</span>
        </div>
        <Card>
          <CardHeader title="Summary" />
          <CardBody className="grid grid-cols-3 gap-4 font-mono text-body-sm">
            <div><span className="text-text-muted">Basic</span><p className="m-0"><Amount value="40375.00" /></p></div>
            <div><span className="text-text-muted">Gross</span><p className="m-0"><Amount value="80750.00" /></p></div>
            <div><span className="text-text-muted">Net</span><p className="m-0 font-semibold"><Amount value="68637.50" /></p></div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Computation lines" />
          <CardBody className="p-0">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right font-mono">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-3">Basic</td>
                  <td className="px-4 py-3">basic</td>
                  <td className="px-4 py-3 text-right"><Amount value="40375.00" /></td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3">Net Pay</td>
                  <td className="px-4 py-3">net</td>
                  <td className="px-4 py-3 text-right"><Amount value="68637.50" /></td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
