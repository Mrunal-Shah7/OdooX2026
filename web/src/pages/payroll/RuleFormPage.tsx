import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function RuleFormPage() {
  return (
    <>
      <PageHeader title="Basic" subtitle="REGULAR · sequence 1" actions={<Button variant="accent">Save rule</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Name"><Input defaultValue="Basic" /></Field>
            <Field label="Code"><Input defaultValue="BASIC" /></Field>
            <Field label="Category"><Select options={[{ value: 'basic', label: 'Basic' }]} value="basic" /></Field>
            <Field label="Computation"><Select options={[{ value: 'formula', label: 'Formula' }]} value="formula" /></Field>
            <Field label="Formula" className="col-span-2">
              <Input defaultValue="CONTRACT_WAGE * 0.5 * PRORATION" />
            </Field>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
