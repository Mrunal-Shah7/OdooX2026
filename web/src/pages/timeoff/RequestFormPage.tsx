import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Select } from '../../components/ui/Select';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { showToast } from '../../lib/toast';

type RequestDetail = {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  timeOffType: {
    id: string;
    name: string;
    code: string;
    unit: 'days' | 'hours';
    color: string;
  };
  startDate: string;
  endDate: string;
  durationType: 'full_day' | 'half_day' | 'hours';
  requestedHours: string | null;
  durationDays: string;
  durationHours: string;
  status: 'to_approve' | 'approved' | 'refused' | 'cancelled';
  reason: string | null;
  refusalReason: string | null;
  allocation: {
    id: string;
    description: string | null;
    allocated: string;
    remaining: string;
  } | null;
  approver: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

type TimeOffType = {
  id: string;
  name: string;
  code: string;
  unit: 'days' | 'hours';
  requiresAllocation: boolean;
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

export default function RequestFormPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { id?: string };
  const search = useSearch({ strict: false }) as {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
  };
  const id = params.id ?? 'new';
  const isNew = id === 'new';

  const canApprove = user ? isHrManagerOrAbove(user.role) : false;

  const [employeeId, setEmployeeId] = useState(search.employeeId ?? user?.employee?.id ?? '');

  const [employeePage, setEmployeePage] = useState(1);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeesList, setEmployeesList] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [hasMoreEmployees, setHasMoreEmployees] = useState(false);

  useEffect(() => {
    setEmployeePage(1);
    setEmployeesList([]);
  }, [employeeSearch]);

  const { isFetching: isFetchingEmployees } = useQuery({
    queryKey: ['employees', { page: employeePage, pageSize: 10, q: employeeSearch }],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(employeePage), pageSize: '10' });
      if (employeeSearch) qs.set('q', employeeSearch);
      const res = await apiRequest<any>(`/api/employees?${qs.toString()}`);
      const data = Array.isArray(res) ? res : res?.data;
      const meta = Array.isArray(res) ? undefined : res?.meta;
      if (data) {
        setEmployeesList((prev) => {
          const merged = [...prev, ...data];
          return Array.from(new Map(merged.map((e: any) => [e.id, e])).values());
        });
        setHasMoreEmployees(meta ? meta.page < meta.totalPages : false);
      }
      return res;
    },
    enabled: isNew && canApprove,
  });

  // Types list
  const { data: typesData = [] } = useQuery<TimeOffType[]>({
    queryKey: ['timeOff', 'types'],
    queryFn: () => apiRequest<TimeOffType[]>('/api/time-off/types'),
  });

  // Request detail if existing
  const {
    data: request,
    isLoading,
    isError,
    refetch,
  } = useQuery<RequestDetail>({
    queryKey: ['timeOff', 'requests', id],
    queryFn: () => apiRequest<RequestDetail>(`/api/time-off/requests/${id}`),
    enabled: !isNew,
  });

  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [startDate, setStartDate] = useState(search.startDate ?? '2026-09-12');
  const [endDate, setEndDate] = useState(search.endDate ?? search.startDate ?? '2026-09-12');
  const [durationType, setDurationType] = useState<'full_day' | 'half_day' | 'hours'>('full_day');
  const [requestedHours, setRequestedHours] = useState('');
  const [reason, setReason] = useState('');
  const [refusalReason, setRefusalReason] = useState('');

  useEffect(() => {
    if (request) {
      setTimeOffTypeId(request.timeOffType.id);
      setStartDate(request.startDate);
      setEndDate(request.endDate);
      setDurationType(request.durationType);
      setRequestedHours(request.requestedHours ?? '');
      setReason(request.reason ?? '');
      setRefusalReason(request.refusalReason ?? '');
    } else {
      if (typesData.length > 0 && !timeOffTypeId) {
        setTimeOffTypeId(typesData[0]?.id ?? '');
      }
    }
  }, [request, typesData, timeOffTypeId]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const targetEmpId = isNew && canApprove ? (employeeId || user?.employee?.id) : user?.employee?.id;
      if (!targetEmpId) throw new Error('Please select an employee');
      if (!timeOffTypeId) throw new Error('Please select a time off type');
      if (!startDate) throw new Error('Start date is required');
      if (!endDate) throw new Error('End date is required');
      if (endDate < startDate) throw new Error('End date must be on or after start date');

      const isWeekend = (dateStr: string) => {
        const d = new Date(`${dateStr}T00:00:00.000Z`);
        const day = d.getUTCDay();
        return day === 0 || day === 6;
      };

      if (isWeekend(startDate)) {
        throw new Error('Start date cannot be on a weekend (Saturday or Sunday)');
      }
      if (isWeekend(endDate)) {
        throw new Error('End date cannot be on a weekend (Saturday or Sunday)');
      }

      if (durationType === 'hours') {
        const hrs = parseFloat(requestedHours);
        if (isNaN(hrs) || hrs <= 0) throw new Error('Requested hours must be a positive number');
      }

      return apiRequest('/api/time-off/requests', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: targetEmpId,
          timeOffTypeId,
          startDate,
          endDate,
          durationType,
          ...(requestedHours ? { requestedHours } : {}),
          reason: reason.trim() || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      showToast({ type: 'success', title: 'Request Submitted', message: 'Time off request submitted successfully.' });
      navigate({ to: '/time-off/requests' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Request Failed', message: err.message });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/time-off/requests/${id}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      showToast({ type: 'success', title: 'Request Approved', message: 'Time off request approved.' });
      navigate({ to: '/time-off/requests' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Approval Failed', message: err.message });
    },
  });

  const refuseMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/time-off/requests/${id}/refuse`, {
        method: 'POST',
        body: JSON.stringify({ refusalReason: refusalReason.trim() || null }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      showToast({ type: 'success', title: 'Request Refused', message: 'Time off request refused.' });
      navigate({ to: '/time-off/requests' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Refusal Failed', message: err.message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/time-off/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff'] });
      showToast({ type: 'success', title: 'Request Cancelled', message: 'Time off request cancelled.' });
      navigate({ to: '/time-off/requests' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Cancellation Failed', message: err.message });
    },
  });

  if (!isNew && isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && isError) {
    return (
      <div className="px-5 py-12">
        <ErrorState message="Could not load time off request" onRetry={() => refetch()} />
      </div>
    );
  }

  const title = isNew
    ? 'New time off request'
    : `${request?.employee.firstName} ${request?.employee.lastName} · ${request?.timeOffType.name}`;
  const selectedTimeOffType = typesData.find((type) => type.id === timeOffTypeId);
  const employeeName = isNew
    ? user?.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : 'Current user'
    : `${request?.employee.firstName} ${request?.employee.lastName}`;
  const timeOffTypeName = isNew
    ? selectedTimeOffType?.name ?? 'Not selected'
    : request?.timeOffType.name ?? 'Not selected';

  return (
    <div className="timeoff-request-page">
      <PageHeader
        title={title}
        subtitle={
          !isNew && request ? (
            <Badge
              variant={
                request.status === 'approved'
                  ? 'success'
                  : request.status === 'to_approve'
                    ? 'warning'
                    : 'danger'
              }
            >
              {request.status.replace('_', ' ')}
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: '/time-off/requests' })}
            >
              Cancel
            </Button>

            {isNew ? (
              <Button
                variant="accent"
                disabled={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit request'}
              </Button>
            ) : request?.status === 'to_approve' ? (
              canApprove ? (
                <>
                  <Button
                    variant="danger"
                    disabled={refuseMutation.isPending}
                    onClick={() => refuseMutation.mutate()}
                  >
                    {refuseMutation.isPending ? 'Refusing...' : 'Refuse'}
                  </Button>
                  <Button
                    variant="accent"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel request'}
                </Button>
              )
            ) : null}
          </div>
        }
      />

      <div className="timeoff-request-page__content">
        <div className="timeoff-request-layout">
          <Card className="timeoff-request-form-card">
            <CardHeader
              title="Request details"
              subtitle={isNew ? 'Choose the dates and leave policy' : 'Review the submitted request'}
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Employee">
                {isNew && canApprove ? (
                  <SearchableSelect
                    options={[
                      ...(user?.employee
                        ? [{ value: user.employee.id, label: `${user.employee.firstName} ${user.employee.lastName} (Me)` }]
                        : []),
                      ...employeesList.map((e) => ({
                        value: e.id,
                        label: `${e.firstName} ${e.lastName}`,
                      })),
                      ...(hasMoreEmployees
                        ? [{ value: 'load_more', label: isFetchingEmployees ? 'Loading...' : 'Show more' }]
                        : []),
                    ]}
                    value={employeeId}
                    onValueChange={(val) => {
                      if (val === 'load_more') {
                        setEmployeePage((p) => p + 1);
                        return;
                      }
                      setEmployeeId(val);
                    }}
                    onSearch={setEmployeeSearch}
                    loading={isFetchingEmployees}
                  />
                ) : (
                  <Input
                    value={
                      isNew
                        ? user?.employee
                          ? `${user.employee.firstName} ${user.employee.lastName}`
                          : 'Current User'
                        : `${request?.employee.firstName} ${request?.employee.lastName}`
                    }
                    readOnly
                    className="bg-surface-sunken"
                  />
                )}
              </Field>

              <Field label="Time off type">
                {isNew ? (
                  <Select
                    options={typesData.map((type) => ({
                      value: type.id,
                      label: `${type.name} (${type.unit})`,
                    }))}
                    value={timeOffTypeId}
                    onValueChange={setTimeOffTypeId}
                  />
                ) : (
                  <Input
                    value={request?.timeOffType.name ?? ''}
                    readOnly
                    className="bg-surface-sunken"
                  />
                )}
              </Field>

              <div className="md:col-span-2">
                <Field
                  label={durationType === 'half_day' ? 'Request date' : 'Date range'}
                  help={
                    durationType === 'half_day'
                      ? 'Half-day requests use one date'
                      : 'Select the start and end dates'
                  }
                  error={
                    (startDate && (new Date(`${startDate}T00:00:00.000Z`).getUTCDay() === 0 || new Date(`${startDate}T00:00:00.000Z`).getUTCDay() === 6)) ||
                    (durationType !== 'half_day' && endDate && (new Date(`${endDate}T00:00:00.000Z`).getUTCDay() === 0 || new Date(`${endDate}T00:00:00.000Z`).getUTCDay() === 6))
                      ? 'Cannot select a weekend (Saturday or Sunday)'
                      : undefined
                  }
                >
                  {durationType === 'half_day' ? (
                    <DatePicker
                      mode="single"
                      value={startDate}
                      onChange={(value) => {
                        setStartDate(value);
                        setEndDate(value);
                      }}
                      readOnly={!isNew}
                      ariaLabel="Time off request date"
                    />
                  ) : (
                    <DatePicker
                      mode="range"
                      value={{ startDate, endDate }}
                      onChange={(value) => {
                        setStartDate(value.startDate);
                        setEndDate(value.endDate);
                      }}
                      readOnly={!isNew}
                      ariaLabel="Time off date range"
                    />
                  )}
                </Field>
              </div>

              <Field label="Duration type">
                {isNew ? (
                  <Select
                    options={[
                      { value: 'full_day', label: 'Full day' },
                      { value: 'half_day', label: 'Half day' },
                      { value: 'hours', label: 'Hours' },
                    ]}
                    value={durationType}
                    onValueChange={(v: string) => {
                      const dt = v as 'full_day' | 'half_day' | 'hours';
                      setDurationType(dt);
                      if (dt === 'half_day') {
                        setEndDate(startDate);
                      }
                    }}
                  />
                ) : (
                  <Input
                    value={request?.durationType.replace('_', ' ') ?? ''}
                    readOnly
                    className="bg-surface-sunken"
                  />
                )}
              </Field>

              <Field label="Hours" help="Required when duration type is Hours">
                <Input
                  value={requestedHours}
                  placeholder="e.g. 4.00"
                  onChange={(e) => setRequestedHours(e.target.value)}
                  readOnly={!isNew}
                  className={`font-mono ${!isNew ? 'bg-surface-sunken' : ''}`}
                />
              </Field>

              {!isNew && request && (
                <>
                  <Field label="Duration in days">
                    <Input
                      value={request.durationDays}
                      readOnly
                      className="bg-surface-sunken font-mono"
                    />
                  </Field>

                  <Field label="Approver">
                    <Input
                      value={
                        request.approver
                          ? `${request.approver.firstName} ${request.approver.lastName}`
                          : '—'
                      }
                      readOnly
                      className="bg-surface-sunken"
                    />
                  </Field>

                  <Field label="Allocation used">
                    <Input
                      value={request.allocation?.description ?? 'Standard policy'}
                      readOnly
                      className="bg-surface-sunken"
                    />
                  </Field>
                </>
              )}

              <Field label="Reason">
                <Input
                  value={reason}
                  placeholder="Reason for time off"
                  onChange={(e) => setReason(e.target.value)}
                  readOnly={!isNew}
                  className={!isNew ? 'bg-surface-sunken' : ''}
                />
              </Field>

              {canApprove && request?.status === 'to_approve' && (
                <Field label="Refusal reason (if refusing)">
                  <Input
                    value={refusalReason}
                    placeholder="Provide a reason if refusing this request"
                    onChange={(e) => setRefusalReason(e.target.value)}
                  />
                </Field>
              )}
              </div>

              {!isNew && request?.allocation && request.status === 'to_approve' && (
                <div className="mt-4 rounded-md border border-warning bg-warning-subtle p-3 text-body-sm text-warning">
                  Approving this consumes {request.durationDays} days from{' '}
                  {request.allocation.description ?? 'allocation'}, leaving{' '}
                  {request.allocation.remaining} days.
                </div>
              )}
            </CardBody>
          </Card>

          <aside className="timeoff-request-sidebar" aria-label="Time off request summary">
            <Card>
              <CardHeader title="Request summary" subtitle="Updates as details change" />
              <CardBody>
                <dl className="timeoff-request-summary">
                  <div className="timeoff-request-summary__row">
                    <dt>Employee</dt>
                    <dd>{employeeName}</dd>
                  </div>
                  <div className="timeoff-request-summary__row">
                    <dt>Time off type</dt>
                    <dd>{timeOffTypeName}</dd>
                  </div>
                  <div className="timeoff-request-summary__row">
                    <dt>Start date</dt>
                    <dd className="timeoff-request-summary__numeric">{startDate || 'Not set'}</dd>
                  </div>
                  <div className="timeoff-request-summary__row">
                    <dt>End date</dt>
                    <dd className="timeoff-request-summary__numeric">{endDate || 'Not set'}</dd>
                  </div>
                  <div className="timeoff-request-summary__row">
                    <dt>Duration type</dt>
                    <dd>{durationType.replace('_', ' ')}</dd>
                  </div>
                  <div className="timeoff-request-summary__row">
                    <dt>{isNew ? 'Requested hours' : 'Duration'}</dt>
                    <dd className="timeoff-request-summary__numeric">
                      {isNew
                        ? durationType === 'hours' && requestedHours
                          ? `${requestedHours} h`
                          : 'Calculated on submission'
                        : `${request?.durationDays ?? '0.00'} days · ${request?.durationHours ?? '0.00'} h`}
                    </dd>
                  </div>
                  {!isNew && request ? (
                    <div className="timeoff-request-summary__row">
                      <dt>Status</dt>
                      <dd>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'success'
                              : request.status === 'to_approve'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={isNew ? 'Before submitting' : 'Approval context'} />
              <CardBody>
                {isNew ? (
                  <ul className="timeoff-request-guidance">
                    <li>Confirm the requested date range.</li>
                    <li>Hours are required only for an hourly request.</li>
                    <li>The final duration follows the working schedule.</li>
                  </ul>
                ) : (
                  <dl className="timeoff-request-summary">
                    <div className="timeoff-request-summary__row">
                      <dt>Approver</dt>
                      <dd>
                        {request?.approver
                          ? `${request.approver.firstName} ${request.approver.lastName}`
                          : 'Not assigned'}
                      </dd>
                    </div>
                    <div className="timeoff-request-summary__row">
                      <dt>Allocation</dt>
                      <dd>{request?.allocation?.description ?? 'No allocation used'}</dd>
                    </div>
                    {request?.allocation ? (
                      <>
                        <div className="timeoff-request-summary__row">
                          <dt>Allocated</dt>
                          <dd className="timeoff-request-summary__numeric">
                            {request.allocation.allocated} {request.timeOffType.unit}
                          </dd>
                        </div>
                        <div className="timeoff-request-summary__row">
                          <dt>Remaining</dt>
                          <dd className="timeoff-request-summary__numeric">
                            {request.allocation.remaining} {request.timeOffType.unit}
                          </dd>
                        </div>
                      </>
                    ) : null}
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
