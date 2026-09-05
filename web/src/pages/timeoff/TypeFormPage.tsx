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
import { FormSkeleton } from '../../components/ui/Skeleton';
import { showToast } from '../../lib/toast';

type TimeOffTypeDetail = {
  id: string;
  name: string;
  code: string;
  unit: 'days' | 'hours';
  requiresAllocation: boolean;
  isPaid: boolean;
  approvalRole: string;
  color: string;
  active: boolean;
};

async function fetchTypeDetail(id: string): Promise<TimeOffTypeDetail> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/time-off/types/${id}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load time off type');
  }
  const json = await res.json();
  return json.data;
}

export default function TypeFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams({ strict: false });
  const isNew = id === 'new' || !id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState<'days' | 'hours'>('days');
  const [requiresAllocation, setRequiresAllocation] = useState(true);
  const [isPaid, setIsPaid] = useState(true);
  const [approvalRole, setApprovalRole] = useState('hr_manager');
  const [color, setColor] = useState('#2563a8');
  const [active, setActive] = useState(true);

  const {
    data: existingType,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['timeOff', 'type', id],
    queryFn: () => fetchTypeDetail(id!),
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (existingType) {
      setName(existingType.name);
      setCode(existingType.code);
      setUnit(existingType.unit);
      setRequiresAllocation(existingType.requiresAllocation);
      setIsPaid(existingType.isPaid);
      setApprovalRole(existingType.approvalRole);
      setColor(existingType.color);
      setActive(existingType.active);
    }
  }, [existingType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Time off type name is required');
      if (isNew) {
        if (!code.trim()) throw new Error('Type code is required');
        if (!/^[A-Za-z0-9_]{1,8}$/.test(code.trim())) {
          throw new Error('Code must contain only uppercase letters, numbers, and underscores (max 8 chars)');
        }
      }
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
        throw new Error('Color must be a valid hex color code (e.g. #3b82f6)');
      }

      const headers = new Headers({ 'Content-Type': 'application/json' });
      const userId = sessionStorage.getItem('pp360_user_id');
      if (userId) {
        headers.set('x-user-id', userId);
      }

      if (isNew) {
        const res = await fetch('/api/time-off/types', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            name,
            code,
            unit,
            requiresAllocation,
            isPaid,
            approvalRole,
            color,
            active,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message ?? 'Failed to create time off type');
        }
        return res.json();
      } else {
        const res = await fetch(`/api/time-off/types/${id}`, {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            name,
            unit,
            requiresAllocation,
            isPaid,
            approvalRole,
            color,
            active,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message ?? 'Failed to update time off type');
        }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeOff', 'types'] });
      showToast({ type: 'success', title: 'Type Saved', message: `Time off type "${name}" saved successfully.` });
      navigate({ to: '/time-off/types' });
    },
    onError: (err: Error) => {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    },
  });

  if (!isNew && isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && isError) {
    return (
      <div className="px-5 py-12">
        <ErrorState message="Could not load time off type" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={isNew ? 'New time off type' : name || 'Time off type'}
        subtitle={
          !isNew ? (
            <Badge variant={active ? 'success' : 'neutral'}>
              {active ? 'active' : 'inactive'}
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: '/time-off/types' })}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save type'}
            </Button>
          </div>
        }
      />

      <div className="space-y-4 px-5 pb-6">
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Type name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paid Time Off"
                  required
                />
              </Field>

              <Field label="Code">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PTO"
                  disabled={!isNew}
                  required
                />
              </Field>

              <Field label="Unit">
                <Select
                  value={unit}
                  onValueChange={(val) => setUnit(val as 'days' | 'hours')}
                  options={[
                    { value: 'days', label: 'Days' },
                    { value: 'hours', label: 'Hours' },
                  ]}
                />
              </Field>

              <Field label="Requires allocation">
                <Select
                  value={requiresAllocation ? 'true' : 'false'}
                  onValueChange={(val) => setRequiresAllocation(val === 'true')}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
              </Field>

              <Field
                label="Counts as paid"
                help="Paid leave counts toward worked days on a payslip."
              >
                <Select
                  value={isPaid ? 'true' : 'false'}
                  onValueChange={(val) => setIsPaid(val === 'true')}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
              </Field>

              <Field label="Approval role">
                <Select
                  value={approvalRole}
                  onValueChange={setApprovalRole}
                  options={[
                    { value: 'hr_manager', label: 'HR Manager' },
                    { value: 'hr_payroll_manager', label: 'Payroll Manager' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
              </Field>

              <Field label="Display colour">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-6 rounded border border-border"
                    style={{ background: color }}
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#2563a8"
                    className="font-mono text-caption"
                  />
                </div>
              </Field>

              <Field label="Active">
                <Select
                  value={active ? 'true' : 'false'}
                  onValueChange={(val) => setActive(val === 'true')}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
              </Field>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
