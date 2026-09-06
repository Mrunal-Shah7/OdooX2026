import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';

type ContractDetail = {
  id: string;
  reference: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  jobPosition: string;
  workingSchedule: {
    id: string;
    name: string;
  };
  salaryStructure: {
    id: string;
    name: string;
    code: string;
  };
  startDate: string;
  endDate: string | null;
  wage: string;
  currency: 'INR' | 'USD';
  status: 'draft' | 'running' | 'expired' | 'cancelled';
  notes: string | null;
};

export default function ContractFormPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [workingScheduleId, setWorkingScheduleId] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [wage, setWage] = useState('0.00');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [status, setStatus] = useState<'draft' | 'running' | 'expired' | 'cancelled'>('draft');
  const [notes, setNotes] = useState('');

  // Fetch dropdown options
  const { data: employeesData } = useQuery({
    queryKey: queryKeys.employees.all({ pageSize: '100' }),
    queryFn: () =>
      apiFetch<{ data: Array<{ id: string; firstName: string; lastName: string; departmentId: string; jobPosition: string; workingScheduleId: string }> }>('/employees?pageSize=100'),
  });

  const { data: departmentsData } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => apiFetch<{ data: Array<{ id: string; name: string }> }>('/departments'),
  });

  const { data: schedulesData } = useQuery({
    queryKey: queryKeys.schedules.all,
    queryFn: () => apiFetch<{ data: Array<{ id: string; name: string }> }>('/working-schedules?pageSize=100'),
  });

  const { data: structuresData } = useQuery({
    queryKey: queryKeys.payroll.structures,
    queryFn: () => apiFetch<{ data: Array<{ id: string; name: string }> }>('/payroll/structures'),
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch contract detail if editing
  const { data: contractData, isLoading: isContractLoading } = useQuery({
    queryKey: queryKeys.contracts.detail(id ?? ''),
    queryFn: () => apiFetch<{ data: ContractDetail }>(`/contracts/${id}`),
    enabled: !isNew,
  });

  useEffect(() => {
    if (contractData?.data) {
      const c = contractData.data;
      setEmployeeId(c.employee.id);
      setDepartmentId(c.department.id);
      setJobPosition(c.jobPosition);
      setWorkingScheduleId(c.workingSchedule.id);
      setSalaryStructureId(c.salaryStructure.id);
      setStartDate(c.startDate);
      setEndDate(c.endDate ?? '');
      setWage(c.wage);
      setCurrency(c.currency);
      setStatus(c.status);
      setNotes(c.notes ?? '');
    }
  }, [contractData]);

  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    if (isNew && employeesData?.data) {
      const emp = employeesData.data.find((e) => e.id === empId);
      if (emp) {
        if (emp.departmentId) setDepartmentId(emp.departmentId);
        if (emp.jobPosition) setJobPosition(emp.jobPosition);
        if (emp.workingScheduleId) setWorkingScheduleId(emp.workingScheduleId);
      }
    }
  };

  const handleSave = () => {
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!employeeId) errors.employeeId = 'Please select an employee';
    if (!departmentId) errors.departmentId = 'Please select a department';
    if (!jobPosition.trim()) errors.jobPosition = 'Job position is required';
    if (!workingScheduleId) errors.workingScheduleId = 'Please select a working schedule';
    if (!salaryStructureId) errors.salaryStructureId = 'Please select a salary structure';
    if (!startDate) errors.startDate = 'Start date is required';
    if (endDate.trim() && startDate && endDate < startDate) {
      errors.endDate = 'End date must be on or after start date';
    }

    const wageNum = parseFloat(wage);
    if (isNaN(wageNum) || wageNum <= 0) {
      errors.wage = 'Wage must be a positive number greater than 0';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const msg = 'Please fill required fields before submitting.';
      showToast({ type: 'error', title: 'Error', message: msg });
      setTimeout(() => {
        document.querySelector('.text-danger')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    saveMutation.mutate();
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        employeeId,
        departmentId,
        jobPosition,
        workingScheduleId,
        salaryStructureId,
        startDate,
        endDate: endDate.trim() ? endDate : null,
        wage: parseFloat(wage).toFixed(2),
        currency,
        status,
        notes: notes.trim() ? notes : null,
      };

      if (isNew) {
        return apiFetch<{ data: ContractDetail }>('/contracts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch<{ data: ContractDetail }>(`/contracts/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      showToast({ type: 'success', title: 'Contract Saved', message: 'Employment contract saved successfully.' });
      navigate({ to: '/contracts' });
    },
    onError: (err: any) => {
      const errMsg = err.message || 'Failed to save contract';
      if (err?.details?.length) {
        const sErrors: Record<string, string> = {};
        err.details.forEach((d: { field?: string; message?: string }) => {
          if (d.field) sErrors[d.field] = d.message || 'Invalid field';
        });
        setFieldErrors(sErrors);
      }
      showToast({ type: 'error', title: 'Save Failed', message: errMsg });
    },
  });

  const employees = employeesData?.data ?? [];
  const departments = departmentsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];
  const structures = structuresData?.data ?? [];
  const currentContract = contractData?.data;

  const employeeOptions = [
    ...(currentContract && !employees.some((employee) => employee.id === currentContract.employee.id)
      ? [{
          value: currentContract.employee.id,
          label: `${currentContract.employee.firstName} ${currentContract.employee.lastName}`,
        }]
      : []),
    ...employees.map((employee) => ({
      value: employee.id,
      label: `${employee.firstName} ${employee.lastName}`,
    })),
  ];

  const departmentOptions = [
    ...(currentContract && !departments.some((department) => department.id === currentContract.department.id)
      ? [{ value: currentContract.department.id, label: currentContract.department.name }]
      : []),
    ...departments.map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  const scheduleOptions = [
    ...(currentContract && !schedules.some((schedule) => schedule.id === currentContract.workingSchedule.id)
      ? [{ value: currentContract.workingSchedule.id, label: currentContract.workingSchedule.name }]
      : []),
    ...schedules.map((schedule) => ({
      value: schedule.id,
      label: schedule.name,
    })),
  ];

  const structureOptions = [
    ...(currentContract && !structures.some((structure) => structure.id === currentContract.salaryStructure.id)
      ? [{ value: currentContract.salaryStructure.id, label: currentContract.salaryStructure.name }]
      : []),
    ...structures.map((structure) => ({
      value: structure.id,
      label: structure.name,
    })),
  ];

  if (!isNew && isContractLoading) {
    return <FormSkeleton />;
  }

  const contract = contractData?.data;

  return (
    <>
      <PageHeader
        title={isNew ? 'New Contract' : (contract?.reference ?? 'Contract')}
        subtitle={
          isNew ? (
            'Create employment contract'
          ) : (
            <>
              {contract?.employee?.firstName} {contract?.employee?.lastName} ·{' '}
              <Badge
                variant={
                  status === 'running'
                    ? 'success'
                    : status === 'draft'
                    ? 'warning'
                    : status === 'expired'
                    ? 'danger'
                    : 'neutral'
                }
              >
                {status}
              </Badge>
            </>
          )
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate({ to: '/contracts' })}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save contract'}
            </Button>
          </>
        }
      />
      <div className="px-4 pb-6 sm:px-5">
        <Card>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Employee *" error={fieldErrors.employeeId}>
                <Select
                  options={employeeOptions}
                  value={employeeId}
                  onValueChange={handleEmployeeChange}
                  placeholder="Select employee"
                  disabled={!isNew}
                />
              </Field>

              <Field label="Department *" error={fieldErrors.departmentId}>
                <Select
                  options={departmentOptions}
                  value={departmentId}
                  onValueChange={setDepartmentId}
                  placeholder="Select department"
                />
              </Field>

              <Field label="Job Position *" error={fieldErrors.jobPosition}>
                <Input
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </Field>

              <Field label="Working Schedule *" error={fieldErrors.workingScheduleId}>
                <Select
                  options={scheduleOptions}
                  value={workingScheduleId}
                  onValueChange={setWorkingScheduleId}
                  placeholder="Select working schedule"
                />
              </Field>

              <Field label="Salary Structure *" error={fieldErrors.salaryStructureId}>
                <Select
                  options={structureOptions}
                  value={salaryStructureId}
                  onValueChange={setSalaryStructureId}
                  placeholder="Select salary structure"
                />
              </Field>

              <Field label="Status" error={fieldErrors.status}>
                <Select
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'running', label: 'Running' },
                    { value: 'expired', label: 'Expired' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                  value={status}
                  onValueChange={(val) => setStatus(val as any)}
                />
              </Field>

              <Field label="Start Date *" error={fieldErrors.startDate}>
                <DatePicker
                  mode="single"
                  value={startDate}
                  onChange={setStartDate}
                  required
                  ariaLabel="Contract start date"
                />
              </Field>

              <Field label="End Date (Optional)" error={fieldErrors.endDate}>
                <DatePicker
                  mode="single"
                  value={endDate}
                  onChange={setEndDate}
                  min={startDate}
                  ariaLabel="Contract end date"
                />
              </Field>

              <Field label="Monthly Wage *" error={fieldErrors.wage}>
                <Input
                  type="number"
                  step="0.01"
                  value={wage}
                  onChange={(e) => setWage(e.target.value)}
                  numeric
                />
              </Field>

              <Field label="Currency">
                <Select
                  options={[
                    { value: 'INR', label: 'INR (₹)' },
                    { value: 'USD', label: 'USD ($)' },
                  ]}
                  value={currency}
                  onValueChange={(val) => setCurrency(val as 'INR' | 'USD')}
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contract terms or notes..."
                className="w-full rounded border border-border bg-surface px-3 py-2 text-body-sm text-text outline-none focus:border-focus-ring min-h-[80px]"
              />
            </Field>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
