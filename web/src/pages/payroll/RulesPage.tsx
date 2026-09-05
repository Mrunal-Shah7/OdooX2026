import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { PayrollNavTabs } from '../../components/layout/PayrollNavTabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { payrollApi, type SalaryRule, type SalaryStructure } from './payrollApi';

export default function RulesPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = () => {
    setLoading(true);
    payrollApi
      .getSalaryRules(selectedStructureId !== 'all' ? { structureId: selectedStructureId } : undefined)
      .then((res: any) => {
        const list: SalaryRule[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setRules(list);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    payrollApi
      .getSalaryStructures()
      .then((res: any) => {
        const list: SalaryStructure[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setStructures(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchRules();
  }, [selectedStructureId]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'basic':
        return <Badge variant="neutral">basic</Badge>;
      case 'allowance':
        return <Badge variant="info">allowance</Badge>;
      case 'gross':
        return <Badge variant="warning">gross</Badge>;
      case 'deduction':
        return <Badge variant="danger">deduction</Badge>;
      case 'net':
        return <Badge variant="success">net</Badge>;
      default:
        return <Badge variant="neutral">{cat}</Badge>;
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchSearch =
      search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <>
      <PayrollNavTabs />
      <PageHeader
        title="Salary rules"
        subtitle="Manage individual salary calculation rules, sequence order, and formulas"
        actions={
          <div className="flex items-center space-x-3">
            <div className="w-56">
              <Input
                placeholder="Search rule name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                value={selectedStructureId}
                onValueChange={setSelectedStructureId}
                options={[
                  { value: 'all', label: 'All Structures' },
                  ...structures.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
            <Button
              variant="accent"
              onClick={() => navigate({ to: '/payroll/rules/$id', params: { id: 'new' } })}
            >
              New rule
            </Button>
          </div>
        }
      />

      <div className="px-5 pb-6 space-y-4">
        {error && (
          <div className="rounded-md bg-danger-subtle p-3 text-body-sm text-danger border border-danger">
            {error}
          </div>
        )}

        <Card>
          {loading ? (
            <div className="p-8 text-center text-body-sm text-text-muted">Loading salary rules...</div>
          ) : (
            <table className="w-full border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                  <th className="px-4 py-3">Structure</th>
                  <th className="px-4 py-3 font-mono">Seq</th>
                  <th className="px-4 py-3">Rule Name</th>
                  <th className="px-4 py-3 font-mono">Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Computation</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                      No salary rules found. Click "New rule" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr
                      key={rule.id}
                      onClick={() => navigate({ to: '/payroll/rules/$id', params: { id: rule.id } })}
                      className="border-b border-border hover:bg-primary-subtle/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-text">{rule.structure?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{rule.sequence}</td>
                      <td className="px-4 py-3 font-medium text-text">{rule.name}</td>
                      <td className="px-4 py-3 font-mono text-caption text-text-muted">{rule.code}</td>
                      <td className="px-4 py-3">{getCategoryBadge(rule.category)}</td>
                      <td className="px-4 py-3 font-mono text-caption capitalize">{rule.computation}</td>
                      <td className="px-4 py-3">
                        {rule.active ? (
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
          )}
        </Card>
      </div>
    </>
  );
}
