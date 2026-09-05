import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function ContractFormPage() {
  return (
    <>
      <PageHeader
        title="CON/2026/0042"
        subtitle={
          <>
            Aarav Mehta · <Badge variant="success">running</Badge>
          </>
        }
        actions={
          <>
            <Button variant="secondary">Cancel</Button>
            <Button variant="accent">Save contract</Button>
          </>
        }
      />
      <div className="px-5 pb-6">
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee"><Select options={[{ value: '1', label: 'Aarav Mehta' }]} value="1" /></Field>
              <Field label="Department"><Select options={[{ value: 'eng', label: 'Engineering' }]} value="eng" /></Field>
              <Field label="Start date"><Input defaultValue="2026-01-01" /></Field>
              <Field label="Wage"><Input defaultValue="85000.00" numeric /></Field>
              <Field label="Structure"><Select options={[{ value: 'reg', label: 'Regular Salary' }]} value="reg" /></Field>
              <Field label="Schedule"><Select options={[{ value: '40', label: '40 Hours / Week' }]} value="40" /></Field>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
