import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export default function AttendanceFormPage() {
  return (
    <>
      <PageHeader
        title="Attendance record"
        subtitle="Aarav Mehta · 2026-09-03"
        actions={
          <>
            <Button variant="secondary">Cancel</Button>
            <Button variant="accent">Save record</Button>
          </>
        }
      />
      <div className="px-5 pb-6">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Employee"><Input defaultValue="Aarav Mehta" readOnly /></Field>
            <Field label="Date"><Input defaultValue="2026-09-03" /></Field>
            <Field label="Check in"><Input defaultValue="09:45" /></Field>
            <Field label="Check out"><Input defaultValue="18:00" /></Field>
            <Field label="Status">
              <Select options={[{ value: 'late', label: 'Late' }]} value="late" />
            </Field>
            <Field label="Status badge"><Badge variant="warning">late</Badge></Field>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
