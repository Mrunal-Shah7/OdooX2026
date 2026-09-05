import { useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function EmployeeFormPage() {
  const { id } = useParams({ from: '/app/employees/$id' });
  const isNew = id === 'new';

  return (
    <>
      <PageHeader
        title={isNew ? 'New employee' : 'Aarav Mehta'}
        subtitle={isNew ? undefined : 'Software Engineer · Engineering'}
        actions={
          <>
            <Button variant="secondary">Cancel</Button>
            <Button variant="accent">Save employee</Button>
          </>
        }
      />
      <div className="px-5 pb-6">
        <div className="mb-5 flex gap-3">
          {['Contracts', 'Attendance', 'Time off', 'Payslips'].map((label) => (
            <button key={label} type="button" className="rounded-md border border-border-strong bg-surface px-4 py-2 text-left">
              <span className="block text-caption text-text-muted">{label}</span>
              <span className="block font-mono text-h3 font-semibold text-primary">2</span>
            </button>
          ))}
        </div>
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name"><Input defaultValue={isNew ? '' : 'Aarav'} /></Field>
              <Field label="Last name"><Input defaultValue={isNew ? '' : 'Mehta'} /></Field>
              <Field label="Work email"><Input defaultValue={isNew ? '' : 'aarav.mehta@peoplepay360.test'} /></Field>
              <Field label="Department">
                <Select options={[{ value: 'eng', label: 'Engineering' }]} value="eng" />
              </Field>
              <Field label="Employee type">
                <Select options={[{ value: 'full_time', label: 'Full time' }]} value="full_time" />
              </Field>
              <Field label="Status">
                <Badge variant="success">active</Badge>
              </Field>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
