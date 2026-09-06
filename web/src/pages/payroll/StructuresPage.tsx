import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { payrollApi, type SalaryStructure } from './payrollApi';
import { showToast } from '../../lib/toast';

export default function StructuresPage() {
  const navigate = useNavigate();
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStructures = () => {
    setLoading(true);
    payrollApi
      .getSalaryStructures()
      .then((res: any) => {
        const list: SalaryStructure[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setStructures(list);
      })
      .catch((err) => showToast({ type: 'error', title: 'Error', message: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  return (
    <>
      <PageHeader
        title="Salary structures"
        subtitle="Manage payroll salary structures and rule sequences"
        actions={
          <Button variant="accent" onClick={() => navigate({ to: '/payroll/structures/$id', params: { id: 'new' } })}>
            New structure
          </Button>
        }
      />
      <PayrollNavTabs />

      <div className="space-y-4 px-4 pb-6 sm:px-5">
        <Card>
          {loading ? (
            <Skeleton className="skeleton--panel" />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Structure Name</th>
                  <th className="px-4 py-3 font-mono">Code</th>
                  <th className="px-4 py-3 text-right font-mono">Attached Rules</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {structures.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                      No salary structures found. Click "New structure" to create one.
                    </td>
                  </tr>
                ) : (
                  structures.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate({ to: '/payroll/structures/$id', params: { id: s.id } })}
                      className="border-b border-border hover:bg-primary-subtle/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-caption text-text-muted">{s.code}</td>
                      <td className="px-4 py-3 text-right font-mono">{s.ruleCount ?? 0} rules</td>
                      <td className="px-4 py-3">
                        {s.active ? (
                          <Badge variant="success">active</Badge>
                        ) : (
                          <Badge variant="neutral">inactive</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
