import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import {
  payrollApi,
  type EligibleEmployee,
  type SalaryStructure,
} from './payrollApi';

interface PayrunWizardProps {
  onSuccess?: () => void;
}

export function PayrunWizard({ onSuccess }: PayrunWizardProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Step 1 state
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [periodStart, setPeriodStart] = useState('2026-09-01');
  const [periodEnd, setPeriodEnd] = useState('2026-09-30');
  const [employeeType, setEmployeeType] = useState('all');
  const [payoutCurrency, setPayoutCurrency] = useState<'INR' | 'USD'>('INR');
  const [exchangeRate, setExchangeRate] = useState('1.000000');

  // Form Step 2 state
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());

  // Load structures when wizard opens
  useEffect(() => {
    if (open) {
      setError(null);
      payrollApi
        .getSalaryStructures()
        .then((res: any) => {
          const list: SalaryStructure[] = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
            ? res.data
            : [];
          setStructures(list);
          if (list.length > 0) {
            setSelectedStructureId(list[0].id);
          }
        })
        .catch((err) => setError(err.message));
    }
  }, [open]);

  const handleNextStep = async () => {
    if (!selectedStructureId) {
      setError('Please select a salary structure.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res: any = await payrollApi.getEligibleEmployees({
        periodStart,
        periodEnd,
        structureId: selectedStructureId,
        employeeType,
      });
      const list: EligibleEmployee[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setEligibleEmployees(list);
      // Select all candidate employees by default
      setSelectedEmployeeIds(new Set(list.map((e) => e.employee.id)));
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch eligible employees');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedEmployeeIds.size === eligibleEmployees.length) {
      setSelectedEmployeeIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(eligibleEmployees.map((e) => e.employee.id)));
    }
  };

  const handleCreatePayrun = async () => {
    if (selectedEmployeeIds.size === 0) {
      setError('Please select at least one employee for the pay run.');
      return;
    }

    const selectedStructure = structures.find((s) => s.id === selectedStructureId);
    const monthName = new Date(periodStart).toLocaleString('default', { month: 'long', year: 'numeric' });
    const payrunName = `${monthName} (${selectedStructure?.name || 'Regular'})`;

    setError(null);
    setLoading(true);

    try {
      const created = await payrollApi.createPayrun({
        name: payrunName,
        salaryStructureId: selectedStructureId,
        periodStart,
        periodEnd,
        payoutCurrency,
        exchangeRate,
        employeeType: employeeType === 'all' ? null : employeeType,
        employeeIds: Array.from(selectedEmployeeIds),
      });

      setOpen(false);
      setStep(1);
      if (onSuccess) onSuccess();

      if (created?.payrun?.id) {
        navigate({ to: '/payroll/payruns/$id', params: { id: created.payrun.id } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create pay run');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (monthValue: string) => {
    // e.g. "2026-09"
    const [year, month] = monthValue.split('-').map(Number);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setPeriodStart(start);
    setPeriodEnd(end);
  };

  return (
    <>
      <Button variant="accent" onClick={() => { setOpen(true); setStep(1); setError(null); }}>
        New pay run
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={step === 1 ? 'New pay run — Step 1: Configuration' : 'New pay run — Step 2: Employee Selection'}
        footer={
          <div className="flex items-center justify-end space-x-3 w-full">
            {step === 2 && (
              <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
            )}
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            {step === 1 ? (
              <Button variant="accent" onClick={handleNextStep} disabled={loading}>
                {loading ? 'Loading...' : 'Continue to Step 2'}
              </Button>
            ) : (
              <Button variant="accent" onClick={handleCreatePayrun} disabled={loading || selectedEmployeeIds.size === 0}>
                {loading ? 'Creating...' : `Create pay run (${selectedEmployeeIds.size} selected)`}
              </Button>
            )}
          </div>
        }
      >
        {error && (
          <div className="mb-4 rounded-md bg-danger-subtle p-3 text-body-sm text-danger border border-danger">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <Field label="Salary structure">
              <Select
                value={selectedStructureId}
                onValueChange={setSelectedStructureId}
                options={
                  structures.length > 0
                    ? structures.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))
                    : [{ value: '', label: 'Loading structures...' }]
                }
              />
            </Field>

            <Field label="Payroll month">
              <Select
                value={periodStart.slice(0, 7)}
                onValueChange={handleMonthChange}
                options={[
                  { value: '2026-09', label: 'September 2026 (2026-09-01 to 2026-09-30)' },
                  { value: '2026-08', label: 'August 2026 (2026-08-01 to 2026-08-31)' },
                  { value: '2026-07', label: 'July 2026 (2026-07-01 to 2026-07-31)' },
                  { value: '2026-10', label: 'October 2026 (2026-10-01 to 2026-10-31)' },
                ]}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Period start">
                <Input value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} placeholder="YYYY-MM-DD" />
              </Field>
              <Field label="Period end">
                <Input value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} placeholder="YYYY-MM-DD" />
              </Field>
            </div>

            <Field label="Employee type filter">
              <Select
                value={employeeType}
                onValueChange={setEmployeeType}
                options={[
                  { value: 'all', label: 'All Employee Types' },
                  { value: 'full_time', label: 'Full-time' },
                  { value: 'part_time', label: 'Part-time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'intern', label: 'Intern' },
                ]}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Payout currency">
                <Select
                  value={payoutCurrency}
                  onValueChange={(val) => setPayoutCurrency(val as 'INR' | 'USD')}
                  options={[
                    { value: 'INR', label: 'INR (Indian Rupee)' },
                    { value: 'USD', label: 'USD (US Dollar)' },
                  ]}
                />
              </Field>
              <Field label="Exchange rate">
                <Input
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="1.000000"
                />
              </Field>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-body-sm font-medium text-text">
                Eligible employees ({selectedEmployeeIds.size} of {eligibleEmployees.length} selected)
              </span>
              <Button variant="secondary" onClick={handleSelectAll} className="h-7 text-caption">
                {selectedEmployeeIds.size === eligibleEmployees.length ? 'Deselect all' : 'Select all'}
              </Button>
            </div>

            {eligibleEmployees.length === 0 ? (
              <p className="py-6 text-center text-body-sm text-text-muted">
                No eligible active employees with running contracts found for this period and structure filter.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-1">
                {eligibleEmployees.map((cand) => {
                  const emp = cand.employee;
                  const isChecked = selectedEmployeeIds.has(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => handleToggleEmployee(emp.id)}
                      className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer border transition-colors ${
                        isChecked
                          ? 'border-accent bg-accent-subtle/30'
                          : 'border-border hover:bg-surface-sunken'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleEmployee(emp.id)}
                        />
                        <div>
                          <div className="text-body-sm font-medium text-text">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-caption text-text-muted">
                            {emp.jobPosition} • {emp.departmentName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-body-sm text-text">
                        {cand.currency} {cand.wage}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
