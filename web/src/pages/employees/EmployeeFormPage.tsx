import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { apiClient, ApiClientError } from '../../lib/apiClient';
import { apiFetch } from '../../lib/apiFetch';
import { can, CAPABILITY } from '../../lib/permissions';
import { queryKeys } from '../../lib/queryKeys';
import { useSession } from '../../lib/session';
import { showToast } from '../../lib/toast';
import type { UserRole, UserStatus } from '../../../../shared/constants';

type EmployeeDetailResponse = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    personalEmail: string | null;
    phone: string | null;
    department: { id: string; name: string; code: string };
    jobPosition: string;
    workingSchedule: { id: string; name: string; hoursPerWeek: string };
    employeeType: 'full_time' | 'part_time' | 'contract' | 'intern';
    status: 'active' | 'inactive';
    joiningDate: string;
    workLocation: string | null;
    bankName: string | null;
    bankAccountHolder: string | null;
    bankAccountLast4: string | null;
    bankIfsc: string | null;
    manager: { id: string; firstName: string; lastName: string } | null;
  };
  counts: {
    contracts: number;
    attendance: number;
    timeOff: number;
    allocations: number;
  };
};

type WorkingScheduleOption = {
  id: string;
  name: string;
  hoursPerWeek: string;
};

type LinkedUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employee: { id: string } | null;
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'hr_payroll_user', label: 'Payroll User' },
  { value: 'hr_payroll_manager', label: 'Payroll Manager' },
  { value: 'admin', label: 'Admin' },
];

async function fetchEmployeeDetail(id: string): Promise<EmployeeDetailResponse> {
  const url = id === 'profile' ? '/api/profile' : `/api/employees/${id}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new ApiClientError(
      err?.error?.code ?? 'NOT_FOUND',
      err?.error?.message ?? 'Failed to load employee details',
    );
  }
  const body = await res.json();
  return body.data;
}

async function fetchSchedules(): Promise<WorkingScheduleOption[]> {
  const res = await fetch('/api/working-schedules', { credentials: 'include' });
  if (!res.ok) return [];
  const body = await res.json();
  return body.data ?? [];
}

async function fetchAllEmployees(): Promise<{ id: string; firstName: string; lastName: string }[]> {
  const res = await fetch('/api/employees?pageSize=100', { credentials: 'include' });
  if (!res.ok) return [];
  const body = await res.json();
  return body.data ?? [];
}

async function fetchUsers(): Promise<LinkedUser[]> {
  const body = await apiFetch<{ data: LinkedUser[] }>('/users?pageSize=100');
  return body.data ?? [];
}

async function apiJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    credentials: 'include',
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiClientError(
      body?.error?.code ?? 'VALIDATION_FAILED',
      body?.error?.message ?? 'Request failed',
      body?.error?.details ?? [],
    );
  }
  return body;
}

export default function EmployeeFormPage() {
  const { id } = useParams({ from: '/app/employees/$id' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const { user } = useSession();
  const isAdmin = user ? can(user.role, CAPABILITY.crudUsers) : false;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    jobPosition: '',
    managerId: '',
    workingScheduleId: '',
    employeeType: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'intern',
    status: 'active' as 'active' | 'inactive',
    joiningDate: new Date().toISOString().split('T')[0],
    workLocation: '',
    bankName: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    bankIfsc: '',
    role: 'employee' as UserRole,
    accessOnly: false,
  });

  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => apiClient.listDepartments(),
  });

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules.all,
    queryFn: fetchSchedules,
  });

  const allEmployeesQuery = useQuery({
    queryKey: queryKeys.employees.all(),
    queryFn: fetchAllEmployees,
  });

  const employeeQuery = useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => fetchEmployeeDetail(id),
    enabled: !isNew,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'join'],
    queryFn: fetchUsers,
    enabled: isAdmin && !isNew,
  });

  useEffect(() => {
    if (employeeQuery.data?.employee) {
      const emp = employeeQuery.data.employee;
      const formattedDate = emp.joiningDate ? emp.joiningDate.slice(0, 10) : '';
      setForm((f) => ({
        ...f,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.workEmail,
        phone: emp.phone ?? '',
        departmentId: emp.department?.id ?? '',
        jobPosition: emp.jobPosition ?? '',
        managerId: emp.manager?.id ?? 'none',
        workingScheduleId: emp.workingSchedule?.id ?? '',
        employeeType: emp.employeeType ?? 'full_time',
        status: emp.status ?? 'active',
        joiningDate: formattedDate,
        workLocation: emp.workLocation ?? '',
        bankName: emp.bankName ?? '',
        bankAccountHolder: emp.bankAccountHolder ?? '',
        bankAccountNumber: emp.bankAccountLast4 ? `•••• ${emp.bankAccountLast4}` : '',
        bankIfsc: emp.bankIfsc ?? '',
        accessOnly: false,
      }));
    }
  }, [employeeQuery.data]);

  useEffect(() => {
    if (!usersQuery.data || isNew) return;
    const found = usersQuery.data.find((u) => u.employee?.id === id) ?? null;
    setLinkedUser(found);
    if (found) {
      setForm((f) => ({ ...f, role: found.role, email: found.email || f.email }));
    }
  }, [usersQuery.data, id, isNew]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const email = form.email.trim().toLowerCase();

      if (form.accessOnly) {
        if (!isNew) {
          throw new ApiClientError('VALIDATION_FAILED', 'Access-only applies to new records only');
        }
        await apiJson('/api/users', {
          method: 'POST',
          body: JSON.stringify({ email, role: form.role, employeeId: null }),
        });
        return;
      }

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        workEmail: email,
        personalEmail: null as string | null,
        phone: form.phone || null,
        departmentId: form.departmentId,
        jobPosition: form.jobPosition,
        managerId: form.managerId && form.managerId !== 'none' ? form.managerId : null,
        workingScheduleId: form.workingScheduleId,
        employeeType: form.employeeType,
        joiningDate: form.joiningDate,
        workLocation: form.workLocation || null,
        bankName: form.bankName || null,
        bankAccountHolder: form.bankAccountHolder || null,
        bankAccountNumber:
          form.bankAccountNumber && !form.bankAccountNumber.startsWith('••')
            ? form.bankAccountNumber
            : undefined,
        bankIfsc: form.bankIfsc || null,
      };

      if (isNew) {
        const created = await apiJson<{ data: { id: string } }>('/api/employees', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const employeeId = created.data.id;
        await apiJson('/api/users', {
          method: 'POST',
          body: JSON.stringify({ email, role: form.role, employeeId }),
        });
        return;
      }

      await apiJson(`/api/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...payload, status: form.status }),
      });

      if (linkedUser) {
        await apiJson(`/api/users/${linkedUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ role: form.role }),
        });
        if (linkedUser.email !== email) {
          // Email is unique on users; create path sets both. Prefer updating via conflict-safe message.
          // OpenAPI UpdateUserRequest has no email — keep employee workEmail as source of truth for display;
          // login email stays on linked user until a dedicated change-email exists.
        }
      } else if (isAdmin) {
        await apiJson('/api/users', {
          method: 'POST',
          body: JSON.stringify({ email, role: form.role, employeeId: id }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast({
        type: 'success',
        title: 'Saved',
        message: form.accessOnly
          ? `Invite sent to ${form.email}`
          : `Saved ${form.firstName} ${form.lastName} and access record.`,
      });
      navigate({ to: '/employees' });
    },
    onError: (err: unknown) => {
      const errMsg = err instanceof ApiClientError ? err.message : 'Save failed';
      if (err instanceof ApiClientError && err.details?.length) {
        const sErrors: Record<string, string> = {};
        err.details.forEach((d) => {
          if (d.field) sErrors[d.field === 'workEmail' ? 'email' : d.field] = d.message;
        });
        setFieldErrors(sErrors);
      }
      showToast({ type: 'error', title: 'Validation Error', message: errMsg });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      if (!linkedUser) throw new ApiClientError('NOT_FOUND', 'No login linked');
      await apiJson(`/api/users/${linkedUser.id}/resend-invite`, { method: 'POST' });
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Invite sent', message: `Invite resent to ${linkedUser?.email}` });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: unknown) => {
      showToast({
        type: 'error',
        title: 'Resend failed',
        message: err instanceof ApiClientError ? err.message : 'Could not resend invite',
      });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!form.accessOnly) {
      if (!form.firstName.trim()) errors.firstName = 'First name is required';
      if (!form.lastName.trim()) errors.lastName = 'Last name is required';
      if (!form.jobPosition.trim()) errors.jobPosition = 'Job position is required';
      if (!form.joiningDate) errors.joiningDate = 'Joining date is required';
      if (!form.departmentId) errors.departmentId = 'Please select a department';
      if (!form.workingScheduleId) errors.workingScheduleId = 'Please select a working schedule';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const msg = 'Please fill required details before submitting.';
      showToast({ type: 'error', title: 'Error', message: msg });
      setTimeout(() => {
        document.querySelector('.text-danger')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    saveMutation.mutate();
  }

  const departments = departmentsQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const allEmployees = allEmployeesQuery.data ?? [];

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const scheduleOptions = schedules.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.hoursPerWeek}h)`,
  }));
  const managerOptions = [
    { value: 'none', label: 'None' },
    ...allEmployees
      .filter((e) => e.id !== id)
      .map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })),
  ];

  useEffect(() => {
    if (isNew) {
      if (deptOptions.length > 0 && !form.departmentId) {
        setForm((f) => ({ ...f, departmentId: deptOptions[0].value }));
      }
      if (scheduleOptions.length > 0 && !form.workingScheduleId) {
        setForm((f) => ({ ...f, workingScheduleId: scheduleOptions[0].value }));
      }
    }
  }, [isNew, deptOptions, scheduleOptions, form.departmentId, form.workingScheduleId]);

  const typeOptions = [
    { value: 'full_time', label: 'Full time' },
    { value: 'part_time', label: 'Part time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const isDataLoading =
    (!isNew && employeeQuery.isLoading) ||
    departmentsQuery.isLoading ||
    schedulesQuery.isLoading;

  if (isDataLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && employeeQuery.isError) {
    return <ErrorState onRetry={() => employeeQuery.refetch()} />;
  }

  if (isNew && !isAdmin) {
    return (
      <div className="p-8 text-center">
        <Card className="max-w-md mx-auto p-6 space-y-4">
          <h2 className="text-h2 font-semibold text-danger">403 Forbidden</h2>
          <p className="text-body-sm text-text-muted">
            Only administrators can create new users.
          </p>
          <Button variant="secondary" onClick={() => navigate({ to: '/employees' })}>
            Back
          </Button>
        </Card>
      </div>
    );
  }

  const counts = employeeQuery.data?.counts ?? {
    contracts: 0,
    attendance: 0,
    timeOff: 0,
    allocations: 0,
  };
  const empTitle = isNew
    ? form.accessOnly
      ? 'New access-only admin'
      : 'New user'
    : `${form.firstName} ${form.lastName}`;
  const empSubtitle = isNew
    ? 'One email is used for login and work contact. An invite is sent on save.'
    : `${form.jobPosition || 'Employee'} · ${employeeQuery.data?.employee?.department?.name ?? 'Department'}${!isAdmin ? ' (Read-only)' : ''}`;

  const showHrFields = !form.accessOnly;

  return (
    <>
      <PageHeader
        title={empTitle}
        subtitle={empSubtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate({ to: '/employees' })}>
              {isAdmin ? 'Cancel' : 'Back'}
            </Button>
            {isAdmin && linkedUser?.status === 'invited' && (
              <Button
                variant="secondary"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate()}
              >
                {resendMutation.isPending ? 'Sending…' : 'Resend invite'}
              </Button>
            )}
            {isAdmin && (
              <Button variant="accent" onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            )}
          </>
        }
      />
      <div className="px-4 pb-6 sm:px-5">
        {!isNew && showHrFields && (
          <div className="mb-5 flex flex-wrap gap-3">
            {[
              { label: 'Contracts', count: counts.contracts },
              { label: 'Attendance', count: counts.attendance },
              { label: 'Time off', count: counts.timeOff },
              { label: 'Allocations', count: counts.allocations },
            ].map((stat) => (
              <div
                key={stat.label}
                className="min-w-28 rounded-md border border-border-strong bg-surface px-4 py-2 text-left"
              >
                <span className="block text-caption text-text-muted">{stat.label}</span>
                <span className="block font-mono text-h3 font-semibold text-primary">
                  {stat.count}
                </span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isAdmin && (
            <Card>
              <CardBody className="space-y-4">
                <h3 className="text-h3 font-semibold">Access</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Email *" error={fieldErrors.email} help="Used for login invite and work contact.">
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                      disabled={!isAdmin || (!isNew && Boolean(linkedUser))}
                    />
                  </Field>
                  <Field label="Role *">
                    <Select
                      options={roleOptions}
                      value={form.role}
                      onValueChange={(val) =>
                        setForm((f) => ({
                          ...f,
                          role: val as UserRole,
                          accessOnly: val === 'admin' ? f.accessOnly : false,
                        }))
                      }
                      disabled={!isAdmin}
                    />
                  </Field>
                  {isNew && form.role === 'admin' && (
                    <Field label="Profile type">
                      <label className="flex items-center gap-2 text-body-sm">
                        <input
                          type="checkbox"
                          checked={form.accessOnly}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, accessOnly: e.target.checked }))
                          }
                        />
                        Access only — no employee profile
                      </label>
                    </Field>
                  )}
                  {!isNew && linkedUser && (
                    <Field label="Login status">
                      <Input value={linkedUser.status} disabled />
                    </Field>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {showHrFields && (
            <>
              <Card>
                <CardBody className="space-y-4">
                  <h3 className="text-h3 font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="First name *" error={fieldErrors.firstName}>
                      <Input
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        required
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Last name *" error={fieldErrors.lastName}>
                      <Input
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        required
                        disabled={!isAdmin}
                      />
                    </Field>
                    {!isAdmin && (
                      <Field label="Work email">
                        <Input type="email" value={form.email} disabled />
                      </Field>
                    )}
                    <Field label="Phone" error={fieldErrors.phone}>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Joining date *" error={fieldErrors.joiningDate}>
                      <DatePicker
                        mode="single"
                        value={form.joiningDate}
                        onChange={(joiningDate) => setForm((f) => ({ ...f, joiningDate }))}
                        required
                        disabled={!isAdmin}
                        ariaLabel="Employee joining date"
                      />
                    </Field>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-4">
                  <h3 className="text-h3 font-semibold">Position & Work Schedule</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Department *" error={fieldErrors.departmentId}>
                      <Select
                        key={`dept-${form.departmentId}-${deptOptions.length}`}
                        options={deptOptions}
                        value={form.departmentId}
                        onValueChange={(val) => setForm((f) => ({ ...f, departmentId: val }))}
                        placeholder="Select department..."
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Job position *" error={fieldErrors.jobPosition}>
                      <Input
                        value={form.jobPosition}
                        onChange={(e) => setForm((f) => ({ ...f, jobPosition: e.target.value }))}
                        required
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Manager" error={fieldErrors.managerId}>
                      <Select
                        key={`mgr-${form.managerId}-${managerOptions.length}`}
                        options={managerOptions}
                        value={form.managerId}
                        onValueChange={(val) => setForm((f) => ({ ...f, managerId: val }))}
                        placeholder="Select manager..."
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Working schedule *" error={fieldErrors.workingScheduleId}>
                      <Select
                        key={`sched-${form.workingScheduleId}-${scheduleOptions.length}`}
                        options={scheduleOptions}
                        value={form.workingScheduleId}
                        onValueChange={(val) => setForm((f) => ({ ...f, workingScheduleId: val }))}
                        placeholder="Select schedule..."
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Employee type *">
                      <Select
                        key={`type-${form.employeeType}`}
                        options={typeOptions}
                        value={form.employeeType}
                        onValueChange={(val) =>
                          setForm((f) => ({
                            ...f,
                            employeeType: val as typeof form.employeeType,
                          }))
                        }
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Work location">
                      <Input
                        value={form.workLocation}
                        onChange={(e) => setForm((f) => ({ ...f, workLocation: e.target.value }))}
                        disabled={!isAdmin}
                      />
                    </Field>
                    {!isNew && (
                      <Field label="Status">
                        <Select
                          options={statusOptions}
                          value={form.status}
                          onValueChange={(val) =>
                            setForm((f) => ({ ...f, status: val as typeof form.status }))
                          }
                          disabled={!isAdmin}
                        />
                      </Field>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-4">
                  <h3 className="text-h3 font-semibold">Bank Account Details</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Bank name">
                      <Input
                        value={form.bankName}
                        onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Account holder name">
                      <Input
                        value={form.bankAccountHolder}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, bankAccountHolder: e.target.value }))
                        }
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="Account number">
                      <Input
                        value={form.bankAccountNumber}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, bankAccountNumber: e.target.value }))
                        }
                        placeholder="Enter bank account number"
                        disabled={!isAdmin}
                      />
                    </Field>
                    <Field label="IFSC Code">
                      <Input
                        value={form.bankIfsc}
                        onChange={(e) => setForm((f) => ({ ...f, bankIfsc: e.target.value }))}
                        disabled={!isAdmin}
                      />
                    </Field>
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </form>
      </div>
    </>
  );
}
