import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';

type AttendanceRecord = {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: string;
  overtimeHours: string;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';
  notes: string | null;
  isManualEdit: boolean;
};

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(path, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return json.data;
}

export default function AttendanceFormPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id ?? 'new';
  const isNew = id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();

  const canEdit = user ? isHrManagerOrAbove(user.role) : false;

  // For new record: fetch employees list
  const { data: employeesData = [] } = useQuery<EmployeeOption[]>({
    queryKey: ['employees', { pageSize: '100' }],
    queryFn: () => apiRequest<EmployeeOption[]>('/api/employees?pageSize=100'),
    enabled: isNew && canEdit,
  });

  const { data: record, isLoading, isError, refetch } = useQuery<AttendanceRecord>({
    queryKey: ['attendance', id],
    queryFn: () => apiRequest<AttendanceRecord>(`/api/attendance/${id}`),
    enabled: !isNew,
  });

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('0.00');
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (record) {
      setEmployeeId(record.employee.id);
      setDate(record.date);
      setCheckIn(record.checkIn ? record.checkIn.slice(0, 16) : '');
      setCheckOut(record.checkOut ? record.checkOut.slice(0, 16) : '');
      setOvertimeHours(record.overtimeHours);
      setStatus(record.status);
      setNotes(record.notes ?? '');
    }
  }, [record]);

  let derivedWorkedHours = record ? record.workedHours : '0.00';
  if (checkIn && checkOut) {
    try {
      const ms = Math.max(0, new Date(checkOut).getTime() - new Date(checkIn).getTime());
      derivedWorkedHours = (ms / (1000 * 60 * 60)).toFixed(2);
    } catch {
      // Keep the loaded value until both entries are valid.
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      const payload: Record<string, unknown> = {
        checkIn: checkIn ? new Date(checkIn).toISOString() : null,
        checkOut: checkOut ? new Date(checkOut).toISOString() : null,
        overtimeHours,
        status,
        notes: notes.trim() || null,
      };

      if (isNew) {
        if (!employeeId) throw new Error('Please select an employee');
        payload['employeeId'] = employeeId;
        payload['date'] = date;
        return apiRequest('/api/attendance', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      return apiRequest(`/api/attendance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      navigate({ to: '/attendance' });
    },
    onError: (error: Error) => {
      setErrorMsg(error.message);
    },
  });

  if (!isNew && isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && isError) {
    return (
      <div className="p-8">
        <ErrorState message="Failed to load attendance record" onRetry={() => refetch()} />
      </div>
    );
  }

  const title = isNew
    ? 'New attendance record'
    : `${record?.employee.firstName} ${record?.employee.lastName} · ${record?.date}`;
  const subtitle = isNew
    ? 'Record attendance manually'
    : `${record?.employee.departmentName} · ${record?.employee.jobPosition}`;
  const selectedEmployee = employeesData.find((employee) => employee.id === employeeId);
  const employeeName = isNew
    ? selectedEmployee
      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
      : 'Not selected'
    : `${record?.employee.firstName} ${record?.employee.lastName}`;

  return (
    <div className="attendance-form-page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate({ to: '/attendance' })}>
              Cancel
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save record'}
              </Button>
            )}
          </div>
        }
      />

      <div className="attendance-form-page__content">
        {errorMsg && (
          <div className="mb-4 rounded-md border border-danger bg-danger-subtle p-3 text-body-sm text-danger">
            {errorMsg}
          </div>
        )}

        <div className="attendance-record-layout">
          <Card className="attendance-record-form-card">
            <CardHeader
              title="Attendance details"
              subtitle={isNew ? 'Create a manual attendance record' : 'Review or correct this record'}
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Employee">
                {isNew ? (
                  <Select
                    options={employeesData.map((employee) => ({
                      value: employee.id,
                      label: `${employee.firstName} ${employee.lastName}`,
                    }))}
                    value={employeeId}
                    onValueChange={setEmployeeId}
                    searchable
                    searchPlaceholder="Search employees"
                  />
                ) : (
                  <Input
                    value={`${record?.employee.firstName} ${record?.employee.lastName}`}
                    readOnly
                    className="bg-surface-sunken"
                  />
                )}
              </Field>

              <Field label="Date">
                <DatePicker
                  mode="single"
                  value={date}
                  onChange={setDate}
                  readOnly={!isNew}
                  ariaLabel="Attendance date"
                />
              </Field>

              <Field label="Check in" help="Select a calendar date and local time">
                <DateTimePicker
                  value={checkIn}
                  onChange={setCheckIn}
                  readOnly={!canEdit}
                  ariaLabel="Check-in date and time"
                />
              </Field>
              <Field label="Check out" help="Select a calendar date and local time">
                <DateTimePicker
                  value={checkOut}
                  onChange={setCheckOut}
                  readOnly={!canEdit}
                  ariaLabel="Check-out date and time"
                />
              </Field>

              <Field label="Worked hours">
                <Input
                  value={derivedWorkedHours}
                  readOnly
                  className="bg-surface-sunken font-mono"
                />
              </Field>

              <Field label="Overtime hours">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  readOnly={!canEdit}
                  className="font-mono"
                />
              </Field>
              <Field label="Status">
                {canEdit ? (
                  <Select
                    options={[
                      { value: 'present', label: 'Present' },
                      { value: 'late', label: 'Late' },
                      { value: 'absent', label: 'Absent' },
                      { value: 'half_day', label: 'Half day' },
                      { value: 'on_leave', label: 'On leave' },
                    ]}
                    value={status}
                    onValueChange={(v: string) =>
                      setStatus(
                        v as 'present' | 'late' | 'absent' | 'half_day' | 'on_leave',
                      )
                    }
                  />
                ) : (
                  <div className="pt-2">
                    <Badge variant="neutral">{status}</Badge>
                  </div>
                )}
              </Field>

              <Field label="Notes">
                <Input
                  value={notes}
                  placeholder="Reason for a correction"
                  onChange={(e) => setNotes(e.target.value)}
                  readOnly={!canEdit}
                />
              </Field>
              </div>

              <p className="border-t border-border pt-3 text-caption text-text-muted">
                Worked hours are derived from check in and check out and cannot be typed.
              </p>
            </CardBody>
          </Card>

          <aside className="attendance-record-sidebar" aria-label="Attendance record summary">
            <Card>
              <CardHeader title="Record summary" subtitle="Updates as details change" />
              <CardBody>
                <dl className="attendance-record-summary">
                  <div className="attendance-record-summary__row">
                    <dt>Employee</dt>
                    <dd>{employeeName}</dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Date</dt>
                    <dd className="attendance-record-summary__numeric">{date || 'Not set'}</dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Check in</dt>
                    <dd className="attendance-record-summary__numeric">
                      {checkIn ? checkIn.replace('T', ' ') : 'Not set'}
                    </dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Check out</dt>
                    <dd className="attendance-record-summary__numeric">
                      {checkOut ? checkOut.replace('T', ' ') : 'Not set'}
                    </dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Worked hours</dt>
                    <dd className="attendance-record-summary__numeric">{derivedWorkedHours} h</dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Overtime</dt>
                    <dd className="attendance-record-summary__numeric">{overtimeHours || '0.00'} h</dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Status</dt>
                    <dd>
                      <Badge variant="neutral">{status.replace('_', ' ')}</Badge>
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={isNew ? 'Before saving' : 'Record context'} />
              <CardBody>
                {isNew ? (
                  <ul className="attendance-record-guidance">
                    <li>Select the employee and attendance date.</li>
                    <li>Check-in and check-out determine worked hours.</li>
                    <li>Use notes to explain a manual correction.</li>
                  </ul>
                ) : (
                  <dl className="attendance-record-summary">
                    <div className="attendance-record-summary__row">
                      <dt>Department</dt>
                      <dd>{record?.employee.departmentName}</dd>
                    </div>
                    <div className="attendance-record-summary__row">
                      <dt>Position</dt>
                      <dd>{record?.employee.jobPosition}</dd>
                    </div>
                    <div className="attendance-record-summary__row">
                      <dt>Work email</dt>
                      <dd className="attendance-record-summary__numeric">
                        {record?.employee.workEmail}
                      </dd>
                    </div>
                    <div className="attendance-record-summary__row">
                      <dt>Entry source</dt>
                      <dd>{record?.isManualEdit ? 'Manually edited' : 'Recorded attendance'}</dd>
                    </div>
                  </dl>
                )}
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
