import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

type AllocationDetail = {
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
  allocated: string;
  taken: string;
  remaining: string;
  validFrom: string;
  validTo: string;
  status: 'draft' | 'approved' | 'refused';
  description: string | null;
  approver: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  } | null;
};

async function fetchAllocationDetail(id: string): Promise<AllocationDetail> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/time-off/allocations/${id}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load allocation detail');
  }
  const json = await res.json();
  return json.data;
}

async function fetchEmployees(): Promise<{ id: string; firstName: string; lastName: string }[]> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch('/api/employees?pageSize=100', { headers, credentials: 'include' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

async function fetchTypes(): Promise<{ id: string; name: string }[]> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch('/api/time-off/types?pageSize=100', { headers, credentials: 'include' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

function getAllocationBadgeVariant(status: string) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'draft':
      return 'warning';
    case 'refused':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function AllocationFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams({ strict: false });
  const isNew = id === 'new' || !id;

  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [allocated, setAllocated] = useState('20.00');
  const [validFrom, setValidFrom] = useState('2026-01-01');
  const [validTo, setValidTo] = useState('2026-12-31');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: fetchEmployees,
    enabled: isNew,
  });

  const { data: types = [] } = useQuery({
    queryKey: ['timeOff', 'types', 'options'],
    queryFn: fetchTypes,
    enabled: isNew,
  });

  const {
    data: existingAllocation,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['timeOff', 'allocation', id],
    queryFn: () => fetchAllocationDetail(id!),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (existingAllocation) {
      setEmployeeId(existingAllocation.employee.id);
      setTimeOffTypeId(existingAllocation.timeOffType.id);
      setAllocated(existingAllocation.allocated);
      setValidFrom(existingAllocation.validFrom);
      setValidTo(existingAllocation.validTo);
      setDescription(existingAllocation.description ?? '');
    }
  }, [existingAllocation]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const userId = sessionStorage.getItem('pp360_user_id');
      if (userId) {
        headers.set('x-user-id', userId);
      }

      if (isNew) {
        const res = await fetch('/api/time-off/allocations', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            employeeId,
            timeOffTypeId,
            allocated,
            validFrom,
            validTo,
            description: description || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message ?? 'Failed to create allocation');
        }
        return res.json();
      } else {
        const res = await fetch(`/api/time-off/allocations/${id}`, {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            allocated,
            validFrom,
            validTo,
            description: description || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message ?? 'Failed to update allocation');
        }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff', 'allocations'] });
      navigate({ to: '/time-off/allocations' });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const userId = sessionStorage.getItem('pp360_user_id');
      if (userId) {
        headers.set('x-user-id', userId);
      }
      const res = await fetch(`/api/time-off/allocations/${id}/approve`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? 'Failed to approve allocation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff', 'allocations'] });
      queryClient.invalidateQueries({ queryKey: ['timeOff', 'allocation', id] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
    },
  });

  const refuseMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const userId = sessionStorage.getItem('pp360_user_id');
      if (userId) {
        headers.set('x-user-id', userId);
      }
      const res = await fetch(`/api/time-off/allocations/${id}/refuse`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? 'Failed to refuse allocation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff', 'allocations'] });
      queryClient.invalidateQueries({ queryKey: ['timeOff', 'allocation', id] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message);
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
        <ErrorState message="Could not load allocation" onRetry={() => refetch()} />
      </div>
    );
  }

  const currentStatus = existingAllocation?.status;
  const approverName = existingAllocation?.approver
    ? `${existingAllocation.approver.firstName} ${existingAllocation.approver.lastName}`
    : '—';

  return (
    <>
      <PageHeader
        title={
          isNew
            ? 'New allocation'
            : `${existingAllocation?.employee.firstName} ${existingAllocation?.employee.lastName} · ${existingAllocation?.timeOffType.name}`
        }
        subtitle={
          !isNew && currentStatus ? (
            <Badge variant={getAllocationBadgeVariant(currentStatus)}>
              {currentStatus}
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: '/time-off/allocations' })}
            >
              Cancel
            </Button>

            {!isNew && (currentStatus === 'draft' || currentStatus === 'approved') && (
              <Button
                variant="danger"
                onClick={() => refuseMutation.mutate()}
                disabled={refuseMutation.isPending}
              >
                Refuse
              </Button>
            )}

            {!isNew && (currentStatus === 'draft' || currentStatus === 'refused') && (
              <Button
                variant="accent"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                Approve
              </Button>
            )}

            <Button
              variant={isNew || currentStatus === 'approved' ? 'accent' : 'secondary'}
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? 'Saving…'
                : isNew
                ? 'Save allocation'
                : 'Save changes'}
            </Button>
          </div>
        }
      />

      <div className="space-y-4 px-5 pb-6">
        {errorMessage && (
          <div className="rounded-md border border-danger bg-danger-subtle p-3 text-body-sm text-danger">
            {errorMessage}
          </div>
        )}

        <Card>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Employee">
                {isNew ? (
                  <Select
                    value={employeeId}
                    onValueChange={setEmployeeId}
                    placeholder="Select employee"
                    options={employees.map((e) => ({
                      value: e.id,
                      label: `${e.firstName} ${e.lastName}`,
                    }))}
                  />
                ) : (
                  <Input
                    value={`${existingAllocation?.employee.firstName} ${existingAllocation?.employee.lastName}`}
                    readOnly
                    className="bg-surface-sunken"
                  />
                )}
              </Field>

              <Field label="Time off type">
                {isNew ? (
                  <Select
                    value={timeOffTypeId}
                    onValueChange={setTimeOffTypeId}
                    placeholder="Select type"
                    options={types.map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                  />
                ) : (
                  <Input
                    value={existingAllocation?.timeOffType.name}
                    readOnly
                    className="bg-surface-sunken"
                  />
                )}
              </Field>

              <Field label="Allocated">
                <Input
                  value={allocated}
                  onChange={(e) => setAllocated(e.target.value)}
                  numeric
                  placeholder="20.00"
                />
              </Field>

              <Field label="Approver">
                <Input
                  value={approverName}
                  readOnly
                  className="bg-surface-sunken"
                />
              </Field>

              <Field label="Valid from">
                <Input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="font-mono"
                />
              </Field>

              <Field label="Valid to">
                <Input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="font-mono"
                />
              </Field>

              {!isNew && (
                <>
                  <Field label="Taken">
                    <Input
                      value={existingAllocation?.taken ?? '0.00'}
                      readOnly
                      numeric
                      className="bg-surface-sunken"
                    />
                  </Field>

                  <Field label="Remaining">
                    <Input
                      value={existingAllocation?.remaining ?? '0.00'}
                      readOnly
                      numeric
                      className="bg-surface-sunken font-semibold"
                    />
                  </Field>
                </>
              )}

              <div className="md:col-span-2">
                <Field label="Description">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Annual leave balance granted at start of policy year"
                  />
                </Field>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
