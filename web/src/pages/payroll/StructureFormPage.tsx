import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { payrollApi, type SalaryRule, type SalaryStructureDetail } from './payrollApi';

export default function StructureFormPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [active, setActive] = useState(true);
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      payrollApi
        .getSalaryStructure(id)
        .then((res: any) => {
          const detail: SalaryStructureDetail = res?.data ? res.data : res;
          setName(detail.name);
          setCode(detail.code);
          setActive(detail.active ?? true);
          setRules(detail.rules || []);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Structure name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Structure code is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isNew) {
        const created = await payrollApi.createSalaryStructure({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          active,
        });
        setSuccess('Structure created successfully.');
        if (created?.id) {
          navigate({ to: '/payroll/structures/$id', params: { id: created.id } });
        }
      } else {
        await payrollApi.updateSalaryStructure(id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          active,
        });
        setSuccess('Structure updated successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'basic':
        return <Badge variant="neutral">basic</Badge>;
      case 'allowance':
        return <Badge variant="info">allowance</Badge>;
      case 'gross':
        return <Badge variant="warning">gross</Badge>;
      case 'deduction':
        return <Badge variant="danger">deduction</Badge>;
      case 'net':
        return <Badge variant="success">net</Badge>;
      default:
        return <Badge variant="neutral">{cat}</Badge>;
    }
  };

  return (
    <>
      <PayrollNavTabs />
      <PageHeader
        title={isNew ? 'New Salary Structure' : `Structure · ${name}`}
        subtitle={isNew ? 'Configure a new salary calculation structure' : `Code: ${code} · ${rules.length} Attached Rules`}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => navigate({ to: '/payroll/structures' })}>
              Back to Structures
            </Button>
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create structure' : 'Save changes'}
            </Button>
          </div>
        }
      />

      <div className="px-5 pb-6 space-y-4">
        {error && (
          <div className="rounded-md bg-danger-subtle p-3 text-body-sm text-danger border border-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-success-subtle p-3 text-body-sm text-success border border-success">
            {success}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-body-sm text-text-muted">Loading structure details...</div>
        ) : (
          <>
            {/* Form Inputs Card */}
            <Card>
              <CardHeader title="Structure Details" />
              <CardBody className="grid grid-cols-2 gap-4">
                <Field label="Structure Name">
                  <Input
                    placeholder="e.g. Regular Salary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field label="Structure Code (Uppercase)">
                  <Input
                    placeholder="e.g. REGULAR"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </Field>
                <div className="col-span-2 flex items-center space-x-2 pt-2">
                  <Checkbox id="active-struct" checked={active} onCheckedChange={(c) => setActive(Boolean(c))} />
                  <label htmlFor="active-struct" className="text-body-sm font-medium cursor-pointer">
                    Active Structure (available for employee contracts & pay runs)
                  </label>
                </div>
              </CardBody>
            </Card>

            {/* Rules Sequence Table */}
            {!isNew && (
              <Card>
                <CardHeader
                  title="Sequence-Ordered Salary Rules"
                  subtitle="Rules are evaluated sequentially in ascending order"
                  actions={
                    <Button
                      variant="accent"
                      onClick={() => navigate({ to: '/payroll/rules/$id', params: { id: 'new' } })}
                    >
                      Add new rule
                    </Button>
                  }
                />
                <CardBody className="p-0">
                  <table className="w-full border-collapse text-body-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                        <th className="px-4 py-3 font-mono">Seq</th>
                        <th className="px-4 py-3">Rule Name</th>
                        <th className="px-4 py-3 font-mono">Code</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Computation</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                            No rules attached to this structure. Click "Add new rule" to configure rules.
                          </td>
                        </tr>
                      ) : (
                        rules.map((rule) => (
                          <tr
                            key={rule.id}
                            onClick={() => navigate({ to: '/payroll/rules/$id', params: { id: rule.id } })}
                            className="border-b border-border hover:bg-primary-subtle/50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-semibold">{rule.sequence}</td>
                            <td className="px-4 py-3 font-medium text-text">{rule.name}</td>
                            <td className="px-4 py-3 font-mono text-caption text-text-muted">{rule.code}</td>
                            <td className="px-4 py-3">{getCategoryBadge(rule.category)}</td>
                            <td className="px-4 py-3 font-mono text-caption capitalize">{rule.computation}</td>
                            <td className="px-4 py-3">
                              {rule.active ? (
                                <Badge variant="success">active</Badge>
                              ) : (
                                <Badge variant="neutral">inactive</Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
