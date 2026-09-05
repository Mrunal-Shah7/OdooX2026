import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
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
  };
  const id = params.id ?? 'new';
  const isNew = id === 'new';

  const canApprove = user ? isHrManagerOrAbove(user.role) : false;

  // Types list
  const { data: typesData } = useQuery<TimeOffType[]>({
    queryKey: ['timeOff', 'types'],
    queryFn: async () => {
      const res = await apiRequest<any>('/api/time-off/types');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    },
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
      const typeList: TimeOffType[] = Array.isArray(typesData)
        ? typesData
        : Array.isArray((typesData as any)?.data)
        ? (typesData as any).data
        : [];
      if (typeList.length > 0 && !timeOffTypeId) {
        setTimeOffTypeId(typeList[0]?.id ?? '');
      }
    }
  }, [request, typesData, timeOffTypeId]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const employeeId = user?.employee?.id;
      if (!employeeId) throw new Error('User is not linked to an employee');
      if (!timeOffTypeId) throw new Error('Please select a time off type');
      if (!startDate) throw new Error('Start date is required');
      if (!endDate) throw new Error('End date is required');
      if (endDate < startDate) throw new Error('End date must be on or after start date');
      if (durationType === 'hours') {
        const hrs = parseFloat(requestedHours);
        if (isNaN(hrs) || hrs <= 0) throw new Error('Requested hours must be a positive number');
      }

      return apiRequest('/api/time-off/requests', {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
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
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
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

  return (
    <>
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

      <div className="max-w-3xl px-5 pb-6">
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Employee">
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
              </Field>

              <Field label="Time off type">
                {isNew ? (
                  <Select
                    options={
                      (Array.isArray(typesData)
                        ? typesData
                        : Array.isArray((typesData as any)?.data)
                        ? (typesData as any).data
                        : []
                      ).map((t: any) => ({
                        value: t.id,
                        label: `${t.name} (${t.unit})`,
                      }))
                    }
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

              <Field label="Start date">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (durationType === 'half_day') {
                      setEndDate(e.target.value);
                    }
                  }}
                  readOnly={!isNew}
                  className={`font-mono ${!isNew ? 'bg-surface-sunken' : ''}`}
                />
              </Field>

              <Field label="End date">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  readOnly={!isNew || durationType === 'half_day'}
                  className={`font-mono ${
                    !isNew || durationType === 'half_day' ? 'bg-surface-sunken' : ''
                  }`}
                />
              </Field>

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
      </div>
    </>
  );
}
