import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';

export default function UsersPage() {
  return (
    <>
      <PageHeader title="User management" actions={<Button variant="accent">Invite user</Button>} />
      <div className="px-5 pb-6">
        <Card>
          <table className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Employee</th>
              </tr>
            </thead>
            <tbody>
              {[
                { email: 'admin@peoplepay360.test', role: 'admin', status: 'active', employee: '—' },
                { email: 'payroll.manager@peoplepay360.test', role: 'hr_payroll_manager', status: 'active', employee: '—' },
                { email: 'aarav.mehta@peoplepay360.test', role: 'employee', status: 'active', employee: 'Aarav Mehta' },
                { email: 'invite.pending@peoplepay360.test', role: 'hr_payroll_user', status: 'invited', employee: '—' },
              ].map((row) => (
                <tr key={row.email} className="border-b border-border">
                  <td className="px-4 py-3 font-mono text-caption">{row.email}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === 'invited' ? 'warning' : 'success'}>{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{row.employee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
