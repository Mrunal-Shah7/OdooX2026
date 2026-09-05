import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useState, type FormEvent } from 'react';
import { apiClient, ApiClientError, type Department } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

type DeptForm = { name: string; code: string };

function buildColumns(onEdit: (dept: Department) => void): ColumnDef<Department>[] {
  return [
    { accessorKey: 'name', header: 'Department' },
    {
      accessorKey: 'code',
      header: 'Code',
      meta: { code: true },
    },
    {
      id: 'manager',
      header: 'Manager',
      cell: ({ row }) => {
        const mgr = row.original.manager;
        return mgr ? `${mgr.firstName} ${mgr.lastName}` : '—';
      },
    },
    {
      accessorKey: 'headcount',
      header: 'Headcount',
      meta: { align: 'right' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="secondary" size="sm" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
        </div>
      ),
    },
  ];
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptForm>({ name: '', code: '' });
  const [formError, setFormError] = useState<string | null>(null);

  function openEdit(dept: Department) {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code });
    setFormError(null);
    setModalOpen(true);
  }

  const columns = buildColumns(openEdit);

  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => apiClient.listDepartments(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return apiClient.updateDepartment(editing.id, form);
      }
      return apiClient.createDepartment(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', code: '' });
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiClientError ? err.message : 'Save failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      setModalOpen(false);
      setEditing(null);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiClientError ? err.message : 'Delete failed');
    },
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: '', code: '' });
    setFormError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  const data = departmentsQuery.data ?? [];

  return (
    <>
      <PageHeader title="Departments" actions={<Button variant="accent" onClick={openCreate}>New department</Button>} />
      <div className="px-5 pb-6">
        <Card>
          {departmentsQuery.isLoading ? (
            <Spinner />
          ) : departmentsQuery.isError ? (
            <ErrorState onRetry={() => departmentsQuery.refetch()} />
          ) : data.length === 0 ? (
            <EmptyState message="No departments yet." action={<Button variant="accent" onClick={openCreate}>New department</Button>} />
          ) : (
            <DataTable columns={columns} data={data} />
          )}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit department' : 'New department'}
        footer={
          <>
            {editing && editing.headcount === 0 ? (
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(editing.id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSubmit} disabled={saveMutation.isPending}>
              {editing ? 'Save changes' : 'Create department'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name" htmlFor="dept-name">
            <Input
              id="dept-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Code" htmlFor="dept-code" help="Uppercase, max 8 characters">
            <Input
              id="dept-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              required
              maxLength={8}
            />
          </Field>
          {formError ? <p className="text-body-sm text-danger">{formError}</p> : null}
        </form>
      </Modal>
    </>
  );
}
