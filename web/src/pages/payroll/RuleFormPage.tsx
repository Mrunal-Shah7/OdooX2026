import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { payrollApi, type SalaryRule, type SalaryStructure } from './payrollApi';
import { showToast } from '../../lib/toast';

export default function RuleFormPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [structureId, setStructureId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sequence, setSequence] = useState('10');
  const [category, setCategory] = useState<'basic' | 'allowance' | 'gross' | 'deduction' | 'net'>('basic');
  const [computation, setComputation] = useState<'fixed' | 'percentage' | 'formula'>('formula');
  const [amount, setAmount] = useState('0.00');
  const [percentage, setPercentage] = useState('0.00');
  const [percentageBase, setPercentageBase] = useState<'contract_wage' | 'basic' | 'gross'>('contract_wage');
  const [formula, setFormula] = useState('');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [syntaxNotice, setSyntaxNotice] = useState<string | null>(null);

  useEffect(() => {
    payrollApi
      .getSalaryStructures()
      .then((res: any) => {
        const list: SalaryStructure[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setStructures(list);
        if (isNew && list.length > 0) {
          setStructureId(list[0].id);
        }
      })
      .catch(() => {});

    if (!isNew && id) {
      setLoading(true);
      payrollApi
        .getSalaryRule(id)
        .then((res: any) => {
          const rule: SalaryRule = res?.data ? res.data : res;
          setStructureId(rule.structureId);
          setName(rule.name);
          setCode(rule.code);
          setSequence(rule.sequence.toString());
          setCategory(rule.category);
          setComputation(rule.computation);
          setAmount(rule.amount || '0.00');
          setPercentage(rule.percentage || '0.00');
          setPercentageBase(rule.percentageBase || 'contract_wage');
          setFormula(rule.formula || '');
          setActive(rule.active ?? true);
        })
        .catch((err) => showToast({ type: 'error', title: 'Error', message: err.message }))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleValidateFormula = () => {
    if (!formula.trim()) {
      setSyntaxNotice('Please enter a formula expression to validate.');
      return;
    }
    // Basic syntax check for balanced braces & parentheses
    let openParen = 0;
    let openBrace = 0;
    for (const char of formula) {
      if (char === '(') openParen++;
      if (char === ')') openParen--;
      if (char === '{') openBrace++;
      if (char === '}') openBrace--;
      if (openParen < 0 || openBrace < 0) {
        setSyntaxNotice('Syntax Error: Mismatched closing parentheses or braces.');
        return;
      }
    }
    if (openParen !== 0) {
      setSyntaxNotice('Syntax Error: Unclosed parenthesis "(" in formula.');
      return;
    }
    if (openBrace !== 0) {
      setSyntaxNotice('Syntax Error: Unclosed brace "{" in rule reference.');
      return;
    }
    setSyntaxNotice('✓ Formula syntax check passed. Full AST validation will be performed on save.');
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setSuccess(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Rule name is required.';
    }
    if (!code.trim()) {
      errors.code = 'Rule code is required.';
    } else if (!/^[A-Za-z][A-Za-z0-9_]{0,15}$/.test(code.trim())) {
      errors.code = 'Code must start with a letter and contain only uppercase letters, numbers, and underscores.';
    }
    if (!structureId) {
      errors.structureId = 'Please select a salary structure.';
    }
    const seqNum = parseInt(sequence, 10);
    if (isNaN(seqNum) || seqNum < 1) {
      errors.sequence = 'Sequence must be an integer of 1 or greater.';
    }

    if (computation === 'fixed') {
      const amtNum = parseFloat(amount);
      if (isNaN(amtNum) || amtNum < 0) {
        errors.amount = 'Fixed amount must be a non-negative number.';
      }
    } else if (computation === 'percentage') {
      const pctNum = parseFloat(percentage);
      if (isNaN(pctNum) || pctNum <= 0 || pctNum > 100) {
        errors.percentage = 'Percentage must be between 0 and 100.';
      }
    } else if (computation === 'formula') {
      if (!formula.trim()) {
        errors.formula = 'Formula expression is required.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const msg = 'Please fill the required details properly before saving.';
      showToast({ type: 'error', title: 'Error', message: msg });
      return;
    }

    setSaving(true);

    const payload: Partial<SalaryRule> = {
      structureId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      sequence: parseInt(sequence, 10) || 10,
      category,
      computation,
      active,
    };

    if (computation === 'fixed') {
      payload.amount = amount;
    } else if (computation === 'percentage') {
      payload.percentage = percentage;
      payload.percentageBase = percentageBase;
    } else if (computation === 'formula') {
      payload.formula = formula.trim();
    }

    try {
      if (isNew) {
        const created = await payrollApi.createSalaryRule(payload);
        setSuccess('Salary rule created successfully.');
        showToast({ type: 'success', title: 'Rule Created', message: `Salary rule "${name}" created successfully.` });
        if (created?.id) {
          navigate({ to: '/payroll/rules/$id', params: { id: created.id } });
        }
      } else {
        await payrollApi.updateSalaryRule(id, payload);
        setSuccess('Salary rule updated successfully.');
        showToast({ type: 'success', title: 'Rule Updated', message: `Salary rule "${name}" updated successfully.` });
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to save salary rule';
      if (err?.details?.length) {
        const sErrors: Record<string, string> = {};
        err.details.forEach((d: { field?: string; message?: string }) => {
          if (d.field) sErrors[d.field] = d.message || 'Invalid value';
        });
        setFieldErrors(sErrors);
      }
      showToast({ type: 'error', title: 'Save Failed', message: errMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Are you sure you want to delete this salary rule?')) return;
    setDeleting(true);
    try {
      await payrollApi.deleteSalaryRule(id);
      showToast({ type: 'success', title: 'Rule Deleted', message: 'Salary rule deleted.' });
      navigate({ to: '/payroll/rules' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Delete rule failed' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isNew ? 'New Salary Rule' : `Rule · ${name}`}
        subtitle={isNew ? 'Define a new computation rule for salary calculation' : `Code: ${code} · Sequence: ${sequence}`}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => navigate({ to: '/payroll/rules' })}>
              Back to Rules
            </Button>
            {!isNew && (
              <Button variant="danger" onClick={handleDelete} disabled={deleting || saving}>
                {deleting ? 'Deleting...' : 'Delete rule'}
              </Button>
            )}
            <Button variant="accent" onClick={handleSave} disabled={saving || deleting}>
              {saving ? 'Saving...' : isNew ? 'Create rule' : 'Save changes'}
            </Button>
          </div>
        }
      />
      <PayrollNavTabs />

      <div className="px-5 pb-6 space-y-4">
        {success && (
          <div className="rounded-md bg-success-subtle p-3 text-body-sm text-success border border-success">
            {success}
          </div>
        )}

        {loading ? (
          <Skeleton className="skeleton--panel" />
        ) : (
          <Card>
            <CardHeader title="Salary Rule Configuration" />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Salary Structure *" error={fieldErrors.structureId}>
                  <Select
                    value={structureId}
                    onValueChange={setStructureId}
                    options={
                      structures.length > 0
                        ? structures.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))
                        : [{ value: '', label: 'Loading structures...' }]
                    }
                  />
                </Field>

                <Field label="Sequence Execution Order *" error={fieldErrors.sequence}>
                  <Input
                    type="number"
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </Field>

                <Field label="Rule Name *" error={fieldErrors.name}>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Basic Salary"
                  />
                </Field>

                <Field label="Rule Code (Uppercase) *" error={fieldErrors.code}>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. BASIC"
                  />
                </Field>

                <Field label="Rule Category *" error={fieldErrors.category}>
                  <Select
                    value={category}
                    onValueChange={(val: any) => setCategory(val)}
                    options={[
                      { value: 'basic', label: 'Basic' },
                      { value: 'allowance', label: 'Allowance' },
                      { value: 'gross', label: 'Gross' },
                      { value: 'deduction', label: 'Deduction' },
                      { value: 'net', label: 'Net' },
                    ]}
                  />
                </Field>

                <Field label="Computation Method *" error={fieldErrors.computation}>
                  <Select
                    value={computation}
                    onValueChange={(val: any) => setComputation(val)}
                    options={[
                      { value: 'fixed', label: 'Fixed Amount' },
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'formula', label: 'Formula Expression' },
                    ]}
                  />
                </Field>
              </div>

              {/* Dynamic Computation Inputs */}
              {computation === 'fixed' && (
                <div className="rounded-lg bg-surface-sunken p-4 border border-border space-y-3">
                  <Field label="Fixed Amount *" error={fieldErrors.amount}>
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 5000.00"
                    />
                  </Field>
                </div>
              )}

              {computation === 'percentage' && (
                <div className="rounded-lg bg-surface-sunken p-4 border border-border grid grid-cols-2 gap-4">
                  <Field label="Percentage Value (%) *" error={fieldErrors.percentage}>
                    <Input
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      placeholder="e.g. 50"
                    />
                  </Field>
                  <Field label="Percentage Base">
                    <Select
                      value={percentageBase}
                      onValueChange={(val: any) => setPercentageBase(val)}
                      options={[
                        { value: 'contract_wage', label: 'Contract Monthly Wage' },
                        { value: 'basic', label: 'Running BASIC Total' },
                        { value: 'gross', label: 'Running GROSS Total' },
                      ]}
                    />
                  </Field>
                </div>
              )}

              {computation === 'formula' && (
                <div className="rounded-lg bg-surface-sunken p-4 border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-body-sm font-medium text-text">Formula Expression</label>
                    <Button variant="secondary" onClick={handleValidateFormula}>
                      Validate Syntax
                    </Button>
                  </div>
                  <Input
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="e.g. CONTRACT_WAGE * 0.5 * PRORATION"
                    className="font-mono"
                  />
                  {syntaxNotice && (
                    <div
                      className={`text-caption font-mono ${
                        syntaxNotice.startsWith('✓') ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {syntaxNotice}
                    </div>
                  )}
                  <div className="text-caption text-text-muted space-y-1 pt-1">
                    <p className="m-0">
                      <strong>Available Variables:</strong> <code>CONTRACT_WAGE</code>, <code>SCHEDULED_DAYS</code>, <code>WORKED_DAYS</code>, <code>PAID_LEAVE_DAYS</code>, <code>UNPAID_LEAVE_DAYS</code>, <code>ABSENT_DAYS</code>, <code>OVERTIME_HOURS</code>, <code>DAILY_RATE</code>, <code>HOURLY_RATE</code>, <code>PRORATION</code>, <code>BASIC</code>, <code>ALLOWANCE</code>, <code>GROSS</code>, <code>DEDUCTION</code>
                    </p>
                    <p className="m-0">
                      <strong>Rule References:</strong> Use <code>{"{RULE_CODE}"}</code> to reference previously computed rules with smaller sequence numbers.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="active-rule" checked={active} onCheckedChange={(c) => setActive(Boolean(c))} />
                <label htmlFor="active-rule" className="text-body-sm font-medium cursor-pointer">
                  Active Rule (included in salary computation)
                </label>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
