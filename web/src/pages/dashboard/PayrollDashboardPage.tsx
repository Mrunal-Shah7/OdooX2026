import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Select } from '../../components/ui/Select';
import { Amount } from '../../components/ui/Amount';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';

export default function PayrollDashboardPage() {
  return (
    <>
      <PayrollNavTabs />
      <PageHeader title="Payroll dashboard" subtitle="September 2026" />
      <div className="space-y-5 px-5 pb-6">
        <div className="flex gap-3">
          <Select options={[{ value: '2026-09', label: 'September 2026' }]} value="2026-09" />
          <Select options={[{ value: 'all', label: 'All departments' }]} value="all" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Headcount', value: '38' },
            { label: 'Gross payroll', value: '₹32,45,000' },
            { label: 'Net payroll', value: '₹27,80,000' },
            { label: 'Open warnings', value: '4' },
            { label: 'Draft pay runs', value: '1' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardBody>
                <p className="m-0 text-label text-text-muted">{kpi.label}</p>
                <p className="m-0 mt-1 font-mono text-metric font-semibold">{kpi.value}</p>
              </CardBody>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <BarChartCard
            title="Salary by department"
            data={[
              { name: 'FIN', value: 520000 },
              { name: 'HR', value: 410000 },
              { name: 'ENG', value: 1450000 },
              { name: 'SLS', value: 620000 },
              { name: 'SUP', value: 345000 },
            ]}
          />
          <LineChartCard
            title="Monthly trend"
            data={[
              { name: 'Jul', value: 3180000 },
              { name: 'Aug', value: 3245000 },
              { name: 'Sep', value: 0 },
            ]}
          />
        </div>
        <Card>
          <CardHeader title="Department overview" />
          <CardBody className="p-0">
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right font-mono">Headcount</th>
                  <th className="px-4 py-3 text-right font-mono">Monthly salary</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-3">Engineering</td>
                  <td className="px-4 py-3 text-right font-mono">14</td>
                  <td className="px-4 py-3 text-right"><Amount value="1450000.00" /></td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
