import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';

const notifications = [
  { title: 'Leave request pending', body: 'Sanjay Mehra requested 3 days PTO', unread: true },
  { title: 'August pay run validated', body: 'August 2026 pay run is ready for payment', unread: true },
  { title: 'Leave refused', body: 'Sick leave request was refused', unread: true },
  { title: 'Payslip delivered', body: 'July payslip sent to 38 employees', unread: false },
];

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" actions={<Button variant="secondary">Mark all read</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <CardBody className="divide-y divide-border p-0">
            {notifications.map((n) => (
              <div
                key={n.title}
                className={`px-5 py-4 ${n.unread ? 'bg-accent-subtle/40' : ''}`}
              >
                <p className="m-0 font-semibold">{n.title}</p>
                <p className="m-0 mt-1 text-body-sm text-text-muted">{n.body}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
