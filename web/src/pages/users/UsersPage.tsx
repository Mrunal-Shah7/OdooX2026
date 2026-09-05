import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Mail, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmployeeNavTabs } from '../../components/layout/EmployeeNavTabs';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { apiFetch } from '../../lib/apiFetch';
import { useSession } from '../../lib/session';
import type { UserRole, UserStatus } from '../../../../shared/constants';

type UserItem = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employee: { id: string; firstName: string; lastName: string } | null;
};

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
};

const roleOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'hr_payroll_user', label: 'Payroll Officer' },
  { value: 'hr_payroll_manager', label: 'Payroll Manager' },
  { value: 'admin', label: 'Administrator' },
];

const statusOptions = [
  { value: 'invited', label: 'Invited' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
];

export default function UsersPage() {
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();

  // Modal states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('employee');
  const [inviteEmployeeId, setInviteEmployeeId] = useState<string>('');

  // Edit form state
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editEmployeeId, setEditEmployeeId] = useState<string>('');

  // Error & Feedback states
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Queries
  const { data: usersData, isLoading: isUsersLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<{ data: UserItem[] }>('/users'),
    enabled: isAdmin,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: () => apiFetch<{ data: EmployeeOption[] }>('/employees?pageSize=100'),
    enabled: isAdmin,
  });

  const employeeSelectOptions = useMemo(() => {
    const list = employeesData?.data ?? [];
    return [
      { value: '', label: 'None (Unlinked)' },
      ...list.map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName} (${e.workEmail})`,
      })),
    ];
  }, [employeesData]);

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      return apiFetch<{ data: UserItem }>('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          employeeId: inviteEmployeeId || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteEmployeeId('');
      setActionSuccess('User invite sent successfully');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to invite user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      setFormError(null);
      return apiFetch<{ data: UserItem }>(`/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: editRole,
          status: editStatus,
          employeeId: editEmployeeId || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      setActionSuccess('User updated successfully');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update user');
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiFetch(`/users/${userId}/resend-invite`, { method: 'POST' });
    },
    onSuccess: () => {
      setActionSuccess('Invitation email re-sent');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionSuccess(err.message || 'Failed to resend invite');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const handleOpenEdit = (item: UserItem) => {
    setEditingUser(item);
    setEditRole(item.role);
    setEditStatus(item.status);
    setEditEmployeeId(item.employee?.id ?? '');
    setFormError(null);
  };

  const columns = useMemo<ColumnDef<UserItem, any>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        meta: { code: true } as ColumnMeta,
        cell: (info) => <span className="font-mono text-caption">{info.getValue()}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info) => {
          const roleVal = info.getValue() as UserRole;
          const match = roleOptions.find((r) => r.value === roleVal);
          return match ? match.label : roleVal;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as UserStatus;
          return (
            <Badge variant={status === 'invited' ? 'warning' : status === 'disabled' ? 'danger' : 'success'}>
              {status}
            </Badge>
          );
        },
      },
      {
        id: 'employee',
        header: 'Linked Employee',
        cell: (info) => {
          const emp = info.row.original.employee;
          return emp ? `${emp.firstName} ${emp.lastName}` : '—';
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { align: 'right' } as ColumnMeta,
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              {row.status === 'invited' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => resendInviteMutation.mutate(row.id)}
                  title="Resend Invitation"
                  className="flex items-center gap-1"
                >
                  <Mail className="size-3.5" />
                  <span>Resend</span>
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEdit(row)}
                title="Edit User"
                className="flex items-center gap-1"
              >
                <Pencil className="size-3.5" />
                <span>Edit</span>
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  if (!isAdmin) {
    return (
      <>
        <PageHeader title="User management" />
        <div className="p-8 text-center">
          <Card className="max-w-md mx-auto p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-danger">403 Forbidden</h2>
            <p className="text-body-sm text-text-muted">
              Only administrators can access user management.
            </p>
          </Card>
        </div>
      </>
    );
  }

  const users = usersData?.data ?? [];

  return (
    <>
      <PageHeader
        title="User management"
        subtitle="Manage system user accounts, roles and employee linkages"
        actions={
          <Button
            variant="accent"
            onClick={() => {
              setFormError(null);
              setIsInviteOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>Invite User</span>
          </Button>
        }
      />
      <EmployeeNavTabs />

      <div className="space-y-4 px-5 pb-6">
        {actionSuccess ? (
          <div className="rounded-md border border-success/30 bg-success-subtle px-4 py-2.5 text-body-sm text-success font-medium">
            {actionSuccess}
          </div>
        ) : null}

        <Card className="p-0 overflow-hidden">
          {isError ? (
            <div className="p-6">
              <ErrorState message="Could not load users" onRetry={() => refetch()} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              isLoading={isUsersLoading}
              emptyMessage="No users found."
            />
          )}
        </Card>
      </div>

      {/* Invite User Modal */}
      <Modal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title="Invite New User"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate();
          }}
          className="space-y-4"
        >
          {formError ? (
            <div className="rounded-md border border-danger/30 bg-danger-subtle p-3 text-body-sm text-danger font-medium">
              {formError}
            </div>
          ) : null}

          <Field label="Email Address">
            <Input
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="System Role">
            <Select
              options={roleOptions}
              value={inviteRole}
              onValueChange={(val) => setInviteRole(val as UserRole)}
            />
          </Field>

          <Field label="Link to Employee Profile">
            <Select
              options={employeeSelectOptions}
              value={inviteEmployeeId}
              onValueChange={setInviteEmployeeId}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending Invite…' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        title={`Edit User: ${editingUser?.email ?? ''}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          {formError ? (
            <div className="rounded-md border border-danger/30 bg-danger-subtle p-3 text-body-sm text-danger font-medium">
              {formError}
            </div>
          ) : null}

          <Field label="System Role">
            <Select
              options={roleOptions}
              value={editRole}
              onValueChange={(val) => setEditRole(val as UserRole)}
            />
          </Field>

          <Field label="Account Status">
            <Select
              options={statusOptions}
              value={editStatus}
              onValueChange={(val) => setEditStatus(val as UserStatus)}
            />
          </Field>

          <Field label="Link to Employee Profile">
            <Select
              options={employeeSelectOptions}
              value={editEmployeeId}
              onValueChange={setEditEmployeeId}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
