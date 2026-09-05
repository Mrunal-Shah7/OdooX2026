import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function RequestFormPage() {
  return (
    <>
      <PageHeader
        title="Time off request"
        subtitle={<Badge variant="warning">to_approve</Badge>}
        actions={
          <>
            <Button variant="danger">Refuse</Button>
            <Button variant="accent">Approve</Button>
          </>
        }
      />
      <div className="px-5 pb-6">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Employee"><Input defaultValue="Sanjay Mehra" readOnly /></Field>
            <Field label="Type"><Select options={[{ value: 'pto', label: 'Paid Time Off' }]} value="pto" /></Field>
            <Field label="Start"><Input defaultValue="2026-09-20" /></Field>
            <Field label="End"><Input defaultValue="2026-09-22" /></Field>
            <Field label="Duration type"><Select options={[{ value: 'full_day', label: 'Full day' }]} value="full_day" /></Field>
            <Field label="Reason"><Input defaultValue="Family event" /></Field>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
