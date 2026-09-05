import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';

export default function TypeFormPage() {
  return (
    <>
      <PageHeader title="Paid Time Off" actions={<Button variant="accent">Save type</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input defaultValue="Paid Time Off" /></Field>
            <Field label="Code"><Input defaultValue="PTO" /></Field>
            <Field label="Unit"><Select options={[{ value: 'days', label: 'Days' }]} value="days" /></Field>
            <Field label="Color"><Input defaultValue="#2563a8" /></Field>
            <Checkbox label="Requires allocation" checked />
            <Checkbox label="Paid leave" checked />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
