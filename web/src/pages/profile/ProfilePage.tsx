import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { components } from '../../../../shared/api-types';
import { PageHeader } from '../../components/layout/PageHeader';
import { startRoleWalkthrough } from '../../components/layout/RoleWalkthrough';
import { Amount } from '../../components/ui/Amount';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { PageSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { apiFetch } from '../../lib/apiFetch';
import { formatDate } from '../../lib/format';
import { can, CAPABILITY } from '../../lib/permissions';
import { queryKeys } from '../../lib/queryKeys';
import { useSession } from '../../lib/session';

type EmployeeDetailResponse = components['schemas']['EmployeeDetailResponse'];
type ContractListResponse = components['schemas']['ContractListResponse'];
type ActiveAttendanceResponse = components['schemas']['ActiveAttendanceResponse'];
type AttendanceResponse = components['schemas']['AttendanceResponse'];

function labelFor(value: string): string {
  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function ProfileFact({
  label,
  children,
  numeric = false,
}: {
  label: string;
  children: ReactNode;
  numeric?: boolean;
}) {
  return (
    <div className="border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="block text-caption text-text-muted">{label}</span>
      <span className={numeric ? 'font-mono text-body-sm text-text' : 'text-body-sm text-text'}>
        {children}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const employeeId = user?.employee?.id;
  const profileQuery = useQuery({
    queryKey: employeeId ? queryKeys.employees.detail(employeeId) : ['profile', 'account-only'],
    queryFn: () => apiFetch<EmployeeDetailResponse>(`/employees/${employeeId}`),
    enabled: Boolean(employeeId),
  });

  const employee = profileQuery.data?.data.employee ?? null;

  const contractsQuery = useQuery({
    queryKey: queryKeys.contracts.all(
      employeeId ? { employeeId, page: '1', pageSize: '100' } : undefined,
    ),
    queryFn: () =>
      apiFetch<ContractListResponse>(
        `/contracts?employeeId=${employeeId}&page=1&pageSize=100`,
      ),
    enabled: Boolean(employeeId),
  });

  const activeContract =
    contractsQuery.data?.data.find((contract) => contract.status === 'running') ?? null;

  const attendanceQuery = useQuery({
    queryKey: queryKeys.attendance.active,
    queryFn: () => apiFetch<ActiveAttendanceResponse>('/attendance/active'),
    enabled: Boolean(employeeId),
  });

  const attendance = attendanceQuery.data?.data;
  const attendanceMutation = useMutation({
    mutationFn: (action: 'check-in' | 'check-out') =>
      apiFetch<AttendanceResponse>(`/attendance/${action}`, { method: 'POST' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.attendance.active });
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      setPasswordError(null);
      setPasswordSuccess(null);

      if (!currentPassword) {
        throw new Error('Enter your current password.');
      }
      if (newPassword.length < 8) {
        throw new Error('The new password must be at least 8 characters.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('The new password and confirmation do not match.');
      }

      return apiFetch<void>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password updated successfully.');
    },
    onError: (error: unknown) => {
      setPasswordError(errorMessage(error, 'The password could not be updated.'));
    },
  });

  const fullName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : user?.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : user?.email ?? 'User';
  const initials = employee
    ? `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase()
    : fullName.slice(0, 2).toUpperCase();
  const role = user?.role ?? 'employee';
  const availableWorkspaces = [
    { label: 'Management', available: can(role, CAPABILITY.crudEmployeesHr) },
    { label: 'Attendance', available: true },
    { label: 'Time off', available: true },
    { label: 'Payroll', available: can(role, CAPABILITY.readPayrollDashboardReports) },
    { label: 'Reports', available: can(role, CAPABILITY.readPayrollDashboardReports) },
    { label: 'User management', available: can(role, CAPABILITY.crudUsers) },
  ].filter((workspace) => workspace.available);
  const isCheckedIn = attendance?.checkedIn ?? false;
  const completedToday = Boolean(attendance?.record?.checkOut);
  const hasCompleteBankDetails = Boolean(
    employee?.bankName &&
      employee.bankAccountHolder &&
      employee.bankAccountLast4 &&
      employee.bankIfsc,
  );
  const attendanceError = attendanceMutation.error
    ? errorMessage(attendanceMutation.error, 'Attendance could not be updated.')
    : null;
  const checkedInAt = attendance?.record?.checkIn
    ? new Date(attendance.record.checkIn).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : null;

  if (employeeId && profileQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (profileQuery.isError) {
    return (
      <>
        <PageHeader title="My profile" subtitle="Your employee and account information" />
        <Card className="mx-5">
          <ErrorState
            message="Your profile could not be loaded."
            onRetry={() => void profileQuery.refetch()}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your employee, contract, bank, and account information"
        actions={
          <Button
            variant="accent"
            onClick={startRoleWalkthrough}
          >
            Start walkthrough
          </Button>
        }
      />

      <div className="px-5 pb-8">
        <Tabs
          defaultValue="overview"
          className="profile-tabs"
          items={[
            {
              value: 'overview',
              label: 'Overview',
              content: (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <Card className="overflow-hidden">
                    <div className="flex items-center gap-4 border-b border-border bg-surface-subtle p-5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-h2 font-bold text-on-accent shadow-md">
                        {initials}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="m-0 text-h2 font-semibold text-text">
                            {employeeId ? fullName : 'Account profile'}
                          </h2>
                          <Badge
                            variant={user?.status === 'active' ? 'success' : 'neutral'}
                            className="font-sans font-medium capitalize tracking-normal"
                          >
                            {labelFor(user?.status ?? 'active')}
                          </Badge>
                        </div>
                        {user?.email ? (
                          <p className="m-0 mt-1 font-mono text-caption text-text-muted">
                            {user.email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <ProfileFact label="Role">
                        <Badge
                          variant="info"
                          className="font-sans font-medium tracking-normal"
                        >
                          {labelFor(role)}
                        </Badge>
                      </ProfileFact>
                      <ProfileFact label="Profile type">
                        {employeeId ? 'Employee linked' : 'Account only'}
                      </ProfileFact>
                      {employee?.workEmail && employee.workEmail !== user?.email ? (
                        <ProfileFact label="Work email" numeric>
                          {employee.workEmail}
                        </ProfileFact>
                      ) : null}
                    </CardBody>
                  </Card>

                  {employeeId ? (
                    <Card className="lg:col-span-2">
                      <CardHeader
                        title="Today’s attendance"
                        subtitle="Clock in at the start of work and clock out when you finish"
                      />
                      <CardBody className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <ProfileFact label="Attendance status">
                            <Badge
                              variant={isCheckedIn ? 'success' : 'neutral'}
                              className="font-sans font-medium tracking-normal"
                            >
                              {isCheckedIn ? 'Clocked in' : completedToday ? 'Clocked out' : 'Not clocked in'}
                            </Badge>
                          </ProfileFact>
                          <ProfileFact label="Worked today" numeric>
                            {attendance?.todayWorkedHours ?? '0.00'} h
                          </ProfileFact>
                          <ProfileFact label="Clock-in time" numeric>
                            {checkedInAt ?? '—'}
                          </ProfileFact>
                          <ProfileFact label="Clock-out time" numeric>
                            {attendance?.record?.checkOut
                              ? new Date(attendance.record.checkOut).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })
                              : '—'}
                          </ProfileFact>
                        </div>

                        {attendanceError ? (
                          <p className="m-0 rounded-md border border-danger bg-danger-subtle p-3 text-body-sm text-danger">
                            {attendanceError}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                          <Button
                            variant="accent"
                            disabled={
                              isCheckedIn ||
                              completedToday ||
                              attendanceQuery.isLoading ||
                              attendanceMutation.isPending
                            }
                            onClick={() => attendanceMutation.mutate('check-in')}
                          >
                            {attendanceMutation.isPending ? 'Updating...' : 'Clock in'}
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={!isCheckedIn || attendanceMutation.isPending}
                            onClick={() => attendanceMutation.mutate('check-out')}
                          >
                            Clock out
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    <Card className="lg:col-span-2">
                      <CardHeader
                        title="Available workspaces"
                        subtitle="Areas available to your account role"
                      />
                      <CardBody className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        {availableWorkspaces.map((workspace) => (
                          <ProfileFact key={workspace.label} label={workspace.label}>
                            <span className="inline-flex items-center gap-2 font-medium text-success">
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                              Included
                            </span>
                          </ProfileFact>
                        ))}
                      </CardBody>
                    </Card>
                  )}

                  {employee ? (
                    <Card className="lg:col-span-3">
                    <CardHeader
                      title="Employee snapshot"
                      subtitle="Your current organisation and contact details"
                    />
                    <CardBody>
                      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ProfileFact label="Job position">{employee.jobPosition}</ProfileFact>
                        <ProfileFact label="Department">{employee.department.name}</ProfileFact>
                        <ProfileFact label="Employee type">
                          {labelFor(employee.employeeType)}
                        </ProfileFact>
                        <ProfileFact label="Joining date" numeric>
                          {formatDate(employee.joiningDate)}
                        </ProfileFact>
                        <ProfileFact label="Manager">
                          {employee.manager
                            ? `${employee.manager.firstName} ${employee.manager.lastName}`
                            : 'Not assigned'}
                        </ProfileFact>
                        <ProfileFact label="Working schedule">
                          {employee.workingSchedule.name}
                        </ProfileFact>
                        <ProfileFact label="Personal email" numeric>
                          {employee.personalEmail ?? 'Not configured'}
                        </ProfileFact>
                        <ProfileFact label="Phone" numeric>
                          {employee.phone ?? 'Not configured'}
                        </ProfileFact>
                        <ProfileFact label="Work location">
                          {employee.workLocation ?? 'Not configured'}
                        </ProfileFact>
                      </div>
                    </CardBody>
                    </Card>
                  ) : null}
                </div>
              ),
            },
            {
              value: 'contract',
              label: 'Contract info',
              content: contractsQuery.isLoading ? (
                <Skeleton className="skeleton--panel" />
              ) : contractsQuery.isError ? (
                <Card>
                  <ErrorState
                    message="Your contract information could not be loaded."
                    onRetry={() => void contractsQuery.refetch()}
                  />
                </Card>
              ) : activeContract ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader
                      title="Employment terms"
                      subtitle="Your current active contract"
                      actions={
                        <Badge
                          variant={activeContract.status === 'running' ? 'success' : 'neutral'}
                          className="font-sans font-medium tracking-normal"
                        >
                          {labelFor(activeContract.status)}
                        </Badge>
                      }
                    />
                    <CardBody className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                      <ProfileFact label="Reference" numeric>
                        {activeContract.reference}
                      </ProfileFact>
                      <ProfileFact label="Job position">{activeContract.jobPosition}</ProfileFact>
                      <ProfileFact label="Department">{activeContract.department.name}</ProfileFact>
                      <ProfileFact label="Start date" numeric>
                        {formatDate(activeContract.startDate)}
                      </ProfileFact>
                      <ProfileFact label="End date" numeric>
                        {activeContract.endDate ? formatDate(activeContract.endDate) : 'Open-ended'}
                      </ProfileFact>
                      <ProfileFact label="Contract status">
                        {labelFor(activeContract.status)}
                      </ProfileFact>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader title="Compensation" subtitle="Current payroll assignment" />
                    <CardBody className="space-y-4">
                      <ProfileFact label="Monthly wage">
                        <Amount value={activeContract.wage} currency={activeContract.currency} />
                      </ProfileFact>
                      <ProfileFact label="Salary structure">
                        {activeContract.salaryStructure.name}
                      </ProfileFact>
                      <ProfileFact label="Structure code" numeric>
                        {activeContract.salaryStructure.code}
                      </ProfileFact>
                    </CardBody>
                  </Card>

                  <Card className="lg:col-span-3">
                    <CardHeader title="Working schedule" />
                    <CardBody className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                      <ProfileFact label="Schedule name">
                        {activeContract.workingSchedule.name}
                      </ProfileFact>
                      <ProfileFact label="Weekly hours" numeric>
                        {activeContract.workingSchedule.hoursPerWeek} h
                      </ProfileFact>
                      <ProfileFact label="Employee type">
                        {employee ? labelFor(employee.employeeType) : 'Not available'}
                      </ProfileFact>
                      <ProfileFact label="Manager">
                        {employee?.manager
                          ? `${employee.manager.firstName} ${employee.manager.lastName}`
                          : 'Not assigned'}
                      </ProfileFact>
                    </CardBody>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader title="Current contract" />
                  <CardBody>
                      <p className="m-0 text-body-sm text-text-muted">
                        No running contract is assigned to this employee.
                      </p>
                  </CardBody>
                </Card>
              ),
            },
            {
              value: 'bank',
              label: 'Bank info',
              content: (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader
                      title="Bank information"
                      subtitle="The account currently used for salary payouts"
                    />
                    <CardBody>
                      {employee ? (
                        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                          <ProfileFact label="Bank name">
                            {employee.bankName ?? 'Not configured'}
                          </ProfileFact>
                          <ProfileFact label="Account holder">
                            {employee.bankAccountHolder ?? 'Not configured'}
                          </ProfileFact>
                          <ProfileFact label="Account number" numeric>
                            {employee.bankAccountLast4
                              ? `•••• ${employee.bankAccountLast4}`
                              : 'Not configured'}
                          </ProfileFact>
                          <ProfileFact label="IFSC / branch code" numeric>
                            {employee.bankIfsc ?? 'Not configured'}
                          </ProfileFact>
                        </div>
                      ) : (
                        <p className="m-0 text-body-sm text-text-muted">
                          This account is not linked to an employee bank record.
                        </p>
                      )}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader title="Payout summary" subtitle="Payroll payment readiness" />
                    <CardBody className="space-y-4">
                      <ProfileFact label="Bank status">
                        <Badge
                          variant={hasCompleteBankDetails ? 'success' : 'warning'}
                          className="font-sans font-medium tracking-normal"
                        >
                          {hasCompleteBankDetails ? 'Ready for payroll' : 'Details incomplete'}
                        </Badge>
                      </ProfileFact>
                      <ProfileFact label="Employee">{fullName}</ProfileFact>
                      <ProfileFact label="Contract" numeric>
                        {activeContract?.reference ?? 'Not assigned'}
                      </ProfileFact>
                      <ProfileFact label="Salary currency" numeric>
                        {activeContract?.currency ?? 'Not available'}
                      </ProfileFact>
                    </CardBody>
                  </Card>
                </div>
              ),
            },
            {
              value: 'security',
              label: 'Security',
              content: (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader
                      title="Change password"
                      subtitle="Use at least eight characters for the new password"
                    />
                    <CardBody>
                      <form
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          changePasswordMutation.mutate();
                        }}
                      >
                        {passwordError ? (
                          <p className="m-0 rounded-md border border-danger bg-danger-subtle p-3 text-body-sm text-danger sm:col-span-2">
                            {passwordError}
                          </p>
                        ) : null}
                        {passwordSuccess ? (
                          <p className="m-0 rounded-md border border-success bg-success-subtle p-3 text-body-sm text-success sm:col-span-2">
                            {passwordSuccess}
                          </p>
                        ) : null}

                        <div className="sm:col-span-2">
                          <Field label="Current password">
                            <Input
                              type="password"
                              value={currentPassword}
                              onChange={(event) => setCurrentPassword(event.target.value)}
                              required
                            />
                          </Field>
                        </div>
                        <Field label="New password">
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            minLength={8}
                            required
                          />
                        </Field>
                        <Field label="Confirm new password">
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            minLength={8}
                            required
                          />
                        </Field>
                        <div className="flex justify-end sm:col-span-2">
                          <Button
                            type="submit"
                            variant="accent"
                            disabled={changePasswordMutation.isPending}
                          >
                            {changePasswordMutation.isPending ? 'Updating...' : 'Update password'}
                          </Button>
                        </div>
                      </form>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader title="Account access" />
                    <CardBody className="space-y-4">
                      <ProfileFact label="Sign-in email" numeric>
                        {user?.email ?? 'Not available'}
                      </ProfileFact>
                      <ProfileFact label="Role">
                        <Badge
                          variant="info"
                          className="font-sans font-medium tracking-normal"
                        >
                          {labelFor(role)}
                        </Badge>
                      </ProfileFact>
                      <ProfileFact label="Account status">
                        <Badge
                          variant={user?.status === 'active' ? 'success' : 'neutral'}
                          className="font-sans font-medium tracking-normal"
                        >
                          {labelFor(user?.status ?? 'active')}
                        </Badge>
                      </ProfileFact>
                      <ProfileFact label="Employee record">
                        {employeeId ? 'Linked' : 'Not linked'}
                      </ProfileFact>
                      <ProfileFact label="Employee name">{fullName}</ProfileFact>
                    </CardBody>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </div>

    </>
  );
}
