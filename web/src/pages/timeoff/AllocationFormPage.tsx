import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormSkeleton } from '../../components/ui/Skeleton';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { showToast } from '../../lib/toast';

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
  const json = await res.json();
  return json.data;
}

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


async function fetchTypes(page = 1): Promise<any> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/time-off/types?page=${page}&pageSize=20`, { headers, credentials: 'include' });
  if (!res.ok) throw new Error();
  return res.json();
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
          return Array.from(new Map(merged.map((e) => [e.id, e])).values());
        });
        setHasMoreEmployees(meta ? meta.page < meta.totalPages : false);
      }
      return res;
    },
    enabled: isNew,
  });

  const [typePage, setTypePage] = useState(1);
  const [typesList, setTypesList] = useState<any[]>([]);
  const [hasMoreTypes, setHasMoreTypes] = useState(false);

  const { isFetching: isFetchingTypes } = useQuery({
    queryKey: ['timeOff', 'types', 'options', typePage],
    queryFn: async () => {
      const res = await fetchTypes(typePage);
      setTypesList((prev) => {
        const merged = [...prev, ...res.data];
        return Array.from(new Map(merged.map((e) => [e.id, e])).values());
      });
      setHasMoreTypes(res.meta?.page < res.meta?.totalPages);
      return res;
    },
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
      if (isNew && !employeeId) throw new Error('Please select an employee');
      if (isNew && !timeOffTypeId) throw new Error('Please select a time off type');
      const allocNum = parseFloat(allocated);
      if (isNaN(allocNum) || allocNum <= 0) throw new Error('Allocated days/hours must be a positive number');
      if (validFrom && validTo && validTo < validFrom) throw new Error('Valid To date must be on or after Valid From date');

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
      showToast({ type: 'success', title: 'Allocation Saved', message: 'Time off allocation saved successfully.' });
      navigate({ to: '/time-off/allocations' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Allocation Save Failed', message: err.message });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
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
      showToast({ type: 'success', title: 'Allocation Approved', message: 'Time off allocation approved.' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Approval Failed', message: err.message });
    },
  });

  const refuseMutation = useMutation({
    mutationFn: async () => {
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
      showToast({ type: 'success', title: 'Allocation Refused', message: 'Time off allocation refused.' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Refusal Failed', message: err.message });
    },
  });

  if (!isNew && isLoading) {
    return <FormSkeleton />;
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
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Employee">
                {isNew ? (
                  <SearchableSelect
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
                    options={[
                      ...employeesList.map((e) => ({
                        value: e.id,
                        label: `${e.firstName} ${e.lastName}`,
                      })),
                      ...(hasMoreEmployees
                        ? [{ value: 'load_more', label: isFetchingEmployees ? 'Loading...' : 'Show more' }]
                        : []),
                    ]}
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
                    onValueChange={(val) => {
                      if (val === 'load_more') {
                        setTypePage((p) => p + 1);
                        return;
                      }
                      setTimeOffTypeId(val);
                    }}
                    placeholder="Select type"
                    options={[
                      ...typesList.map((t) => ({
                        value: t.id,
                        label: t.name,
                      })),
                      ...(hasMoreTypes
                        ? [{ value: 'load_more', label: isFetchingTypes ? 'Loading...' : 'Show more' }]
                        : []),
                    ]}
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
                <DatePicker
                  mode="single"
                  value={validFrom}
                  onChange={setValidFrom}
                  required
                  ariaLabel="Allocation valid from date"
                />
              </Field>

              <Field label="Valid to">
                <DatePicker
                  mode="single"
                  value={validTo}
                  onChange={setValidTo}
                  required
                  ariaLabel="Allocation valid to date"
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
