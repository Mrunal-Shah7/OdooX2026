import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmployeeNavTabs } from '../../components/layout/EmployeeNavTabs';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable, type ColumnMeta } from '../../components/ui/DataTable';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { apiFetch } from '../../lib/apiFetch';
import { queryKeys } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';

type PublicHoliday = {
  id: string;
  name: string;
  date: string;
};

export default function HolidaysPage() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: response, isLoading } = useQuery({
    queryKey: queryKeys.holidays(selectedYear),
    queryFn: () =>
      apiFetch<{ data: PublicHoliday[] }>(`/public-holidays?year=${selectedYear}`),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newHolidayName.trim()) throw new Error('Holiday name is required');
      if (!newHolidayDate) throw new Error('Holiday date is required');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(newHolidayDate)) throw new Error('Holiday date must be in YYYY-MM-DD format');
      const todayStr = new Date().toISOString().slice(0, 10);
      if (newHolidayDate < todayStr) throw new Error('Public holiday date cannot be in the past');

      return apiFetch<{ data: PublicHoliday }>('/public-holidays', {
        method: 'POST',
        body: JSON.stringify({
          name: newHolidayName.trim(),
          date: newHolidayDate,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      showToast({ type: 'success', title: 'Holiday Added', message: `Public holiday "${newHolidayName}" added.` });
      setIsAddOpen(false);
      setNewHolidayName('');
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to add public holiday';
      showToast({ type: 'error', title: 'Add Holiday Failed', message: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/public-holidays/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      showToast({ type: 'success', title: 'Holiday Deleted', message: 'Public holiday removed successfully.' });
    },
    onError: (err: any) => {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Failed to delete holiday' });
    },
  });

  const columns = useMemo<ColumnDef<PublicHoliday, any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Holiday Name',
        cell: (info) => <span className="font-medium text-text">{info.getValue()}</span>,
      },
      {
        accessorKey: 'date',
        header: 'Date',
        meta: { code: true } as ColumnMeta,
        cell: (info) => <span className="font-mono text-caption">{info.getValue()}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableColumnFilter: false,
        cell: (info) => (
          <div className="flex justify-end">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm(`Delete holiday "${info.row.original.name}"?`)) {
                  deleteMutation.mutate(info.row.original.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <>
      <PageHeader
        title="Public Holidays"
        subtitle="Official statutory holidays"
        actions={
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: '2025', label: '2025' },
                { value: '2026', label: '2026' },
                { value: '2027', label: '2027' },
              ]}
              value={String(selectedYear)}
              onValueChange={(val) => setSelectedYear(Number(val))}
            />
            <Button variant="accent" onClick={() => setIsAddOpen(true)}>
              Add holiday
            </Button>
          </div>
        }
      />
      <EmployeeNavTabs />
      <div className="space-y-4 px-5 pb-6">
        <Card className="p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={response?.data ?? []}
            isLoading={isLoading}
            enablePagination={false}
            emptyMessage="No public holidays configured for this year."
          />
        </Card>
      </div>

      <Modal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Add Public Holiday"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newHolidayName.trim() || !newHolidayDate}
            >
              {createMutation.isPending ? 'Adding...' : 'Add holiday'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Field label="Holiday Name">
            <Input
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              placeholder="e.g. Republic Day"
            />
          </Field>

          <Field label="Date">
            <Input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
