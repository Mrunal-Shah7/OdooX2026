import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { TimeOffNavTabs } from '../../components/layout/TimeOffNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';

type TimeOffTypeItem = {
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

type TypesResponse = {
  data: TimeOffTypeItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

async function fetchTypes(page: number, pageSize: number): Promise<TypesResponse> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(`/api/time-off/types?page=${page}&pageSize=${pageSize}`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load time off types');
  }
  return res.json();
}

function formatRole(role: string): string {
  switch (role) {
    case 'hr_manager':
      return 'HR Manager';
    case 'hr_payroll_manager':
      return 'Payroll Manager';
    case 'hr_payroll_user':
      return 'Payroll User';
    case 'admin':
      return 'Admin';
    case 'employee':
      return 'Employee';
    default:
      return role;
  }
}

export default function TypesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timeOff', 'types', page, pageSize],
    queryFn: () => fetchTypes(page, pageSize),
  });

  return (
    <>
      <PageHeader
        title="Time off types"
        subtitle="Policies, not employee transactions"
        actions={
          <Button
            variant="accent"
            onClick={() =>
              navigate({ to: '/time-off/types/$id', params: { id: 'new' } })
            }
          >
            New type
          </Button>
        }
      />

      <TimeOffNavTabs />
      <div className="space-y-4 px-5 pb-6">

        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : isError ? (
            <ErrorState message="Could not load time off types" onRetry={() => refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="No time off types"
              message="No time off types have been configured yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 font-mono">Code</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Allocation</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Approval</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() =>
                        navigate({
                          to: '/time-off/types/$id',
                          params: { id: item.id },
                        })
                      }
                      className="cursor-pointer border-b border-border transition-colors hover:bg-primary-subtle"
                    >
                      <td className="px-4 py-3 font-medium text-text">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ background: item.color }}
                          />
                          <span>{item.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-caption text-text">
                        {item.code}
                      </td>
                      <td className="px-4 py-3 capitalize text-text">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-text">
                        {item.requiresAllocation ? 'Required' : 'Not required'}
                      </td>
                      <td className="px-4 py-3 text-text">
                        {item.isPaid ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-3 text-text">
                        {formatRole(item.approvalRole)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.active ? 'success' : 'neutral'}>
                          {item.active ? 'active' : 'inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-border px-4">
                <Pagination
                  page={data.meta.page}
                  pageSize={data.meta.pageSize}
                  total={data.meta.total}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
