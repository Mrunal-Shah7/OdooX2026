import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { DonutRing } from '../../components/charts/DonutRing';
import { YearCalendar } from './YearCalendar';

export default function TimeOffDashboardPage() {
  return (
    <>
      <PageHeader title="Time off" subtitle="2026 entitlements" actions={<Button variant="accent">New request</Button>} />
      <div className="space-y-5 px-5 pb-6">
        <div className="grid grid-cols-4 gap-4">
          <Card><CardBody className="flex justify-center"><DonutRing value={8} total={20} label="Paid Time Off" /></CardBody></Card>
          <Card><CardBody className="flex justify-center"><DonutRing value={2} total={16} label="Comp Off (hours)" color="var(--color-chart-5)" /></CardBody></Card>
        </div>
        <Card>
          <CardBody>
            <YearCalendar />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
