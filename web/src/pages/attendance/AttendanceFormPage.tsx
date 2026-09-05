import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { showToast } from '../../lib/toast';

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
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id ?? 'new';
  const isNew = id === 'new';

  const canEdit = user ? isHrManagerOrAbove(user.role) : false;

  // For new record: fetch employees list
  const { data: employeesData } = useQuery<EmployeeOption[]>({
    queryKey: ['employees', { pageSize: '100' }],
    queryFn: async () => {
      const res = await apiRequest<any>('/api/employees?pageSize=100');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    },
    enabled: isNew && canEdit,
  });

  // For existing record: fetch record
  const {
    data: record,
    isLoading,
    isError,
    refetch,
  } = useQuery<AttendanceRecord>({
    queryKey: ['attendance', id],
    queryFn: () => apiRequest<AttendanceRecord>(`/api/attendance/${id}`),
    enabled: !isNew,
  });

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('0.00');
  const [status, setStatus] = useState<'present' | 'late' | 'absent' | 'half_day' | 'on_leave'>('present');
  const [notes, setNotes] = useState('');

  // Prepopulate form when record loads
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

  // Derived worked hours preview
  let derivedWorkedHours = record ? record.workedHours : '0.00';
  if (checkIn && checkOut) {
    try {
      const ms = Math.max(0, new Date(checkOut).getTime() - new Date(checkIn).getTime());
      derivedWorkedHours = (ms / (1000 * 60 * 60)).toFixed(2);
    } catch {
      // keep fallback
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
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
      showToast({ type: 'success', title: 'Attendance Saved', message: 'Attendance record saved successfully.' });
      navigate({ to: '/attendance' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    },
  });

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="px-5 py-12">
        <ErrorState message="Could not load attendance record" onRetry={() => refetch()} />
      </div>
    );
  }

  const title = isNew
    ? 'New attendance record'
    : `${record?.employee.firstName} ${record?.employee.lastName} · ${record?.date}`;
  const subtitle = isNew
    ? 'Record attendance manually'
    : `${record?.employee.departmentName} · ${record?.employee.jobPosition}`;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: '/attendance' })}
            >
              Cancel
            </Button>
            {canEdit && (
              <Button
                variant="accent"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save record'}
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-3xl px-5 pb-6">
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Employee">
                {isNew ? (
                  <Select
                    options={
                      (Array.isArray(employeesData)
                        ? employeesData
                        : (employeesData as any)?.data ?? []
                      ).map((e: any) => ({
                        value: e.id,
                        label: `${e.firstName} ${e.lastName}`,
                      }))
                    }
                    value={employeeId}
                    onValueChange={setEmployeeId}
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
                <Input
                  type={isNew ? 'date' : 'text'}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  readOnly={!isNew}
                  className={`font-mono ${!isNew ? 'bg-surface-sunken' : ''}`}
                />
              </Field>

              <Field label="Check in" help="ISO timestamp or local time">
                <Input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  readOnly={!canEdit}
                  className="font-mono"
                />
              </Field>

              <Field label="Check out" help="ISO timestamp or local time">
                <Input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  readOnly={!canEdit}
                  className="font-mono"
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
      </div>
    </>
  );
}
