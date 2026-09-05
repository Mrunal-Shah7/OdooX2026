import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';

export default function AllocationFormPage() {
  return (
    <>
      <PageHeader
        title="PTO allocation"
        subtitle={<Badge variant="success">approved</Badge>}
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
            <Field label="Employee"><Input defaultValue="Aarav Mehta" readOnly /></Field>
            <Field label="Type"><Input defaultValue="Paid Time Off" readOnly /></Field>
            <Field label="Allocated"><Input defaultValue="20.00" numeric /></Field>
            <Field label="Valid from"><Input defaultValue="2026-01-01" /></Field>
            <Field label="Valid to"><Input defaultValue="2026-12-31" /></Field>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
