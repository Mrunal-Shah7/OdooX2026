import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeOffNavTabs } from '../../components/layout/TimeOffNavTabs';
import { useNavigate } from '@tanstack/react-router';
import { DonutRing } from '../../components/charts/DonutRing';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { YearCalendar, type TimeOffCalendarDay } from './YearCalendar';

type TimeOffDashboardData = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  year: number;
  workingSchedule: {
    id: string;
    name: string;
    hoursPerWeek: string;
  };
  days: TimeOffCalendarDay[];
  entitlements: {
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
    pending: string;
  }[];
  unplannedSummary: {
    last30Days: string;
    last3Months: string;
    last6Months: string;
    thisYear: string;
  };
};

async function apiRequest<T>(path: string): Promise<T> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const userId = sessionStorage.getItem('pp360_user_id');
  if (userId) {
    headers.set('x-user-id', userId);
  }
  const res = await fetch(path, { headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? 'Request failed');
  }
  const json = await res.json();
  return json.data;
}

export default function TimeOffDashboardPage() {
  const { user } = useSession();
  const navigate = useNavigate();

  const [year, setYear] = useState(2026);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  const canSwitchEmployee = user ? isHrManagerOrAbove(user.role) : false;

  // If HR/admin, fetch employees list for the employee switcher
  const { data: employeesData } = useQuery<{ id: string; firstName: string; lastName: string }[]>({
    queryKey: ['employees', { pageSize: '100' }],
    queryFn: async () => {
      const res = await apiRequest<any>('/api/employees?pageSize=100');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    },
    enabled: canSwitchEmployee,
  });

  const queryUrl = `/api/time-off/dashboard?year=${year}${
    selectedEmployeeId ? `&employeeId=${selectedEmployeeId}` : ''
  }`;

  const { data, isLoading, isError, refetch } = useQuery<TimeOffDashboardData>({
    queryKey: ['timeOff', 'dashboard', year, selectedEmployeeId],
    queryFn: () => apiRequest<TimeOffDashboardData>(queryUrl),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-5 py-12">
        <ErrorState message="Could not load time off dashboard" onRetry={() => refetch()} />
      </div>
    );
  }

  const entitlements = data.entitlements ?? [];
  const ptoEntitlement = entitlements.find((e) => e?.timeOffType?.code === 'PTO');
  const remainingDays = ptoEntitlement?.remaining ?? '0.00';

  const typesForCalendar = entitlements.map((e) => ({
    id: e.timeOffType.id,
    name: e.timeOffType.name,
    color: e.timeOffType.color,
  }));

  const employeeList: { id: string; firstName: string; lastName: string }[] = Array.isArray(employeesData)
    ? employeesData
    : Array.isArray((employeesData as any)?.data)
    ? (employeesData as any).data
    : [];

  const handleCalendarDateClick = (date: string) => {
    if (!selectedStartDate || selectedEndDate || date < selectedStartDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      return;
    }
    setSelectedEndDate(date);
  };

  const requestLeave = () => {
    if (!selectedStartDate) return;
    navigate({
      to: '/time-off/requests/$id',
      params: { id: 'new' },
      search: {
        startDate: selectedStartDate,
        endDate: selectedEndDate ?? selectedStartDate,
      },
    });
  };

  return (
    <>
      <PageHeader
        title="My time off"
        subtitle={`${data.employee.firstName} ${data.employee.lastName} · ${data.workingSchedule.name} · ${remainingDays} days remaining`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canSwitchEmployee && (
              <div className="w-48">
                <Select
                  options={[
                    { value: '', label: 'My records' },
                    ...employeeList.map((e) => ({
                      value: e.id,
                      label: `${e.firstName} ${e.lastName}`,
                    })),
                  ]}
                  value={selectedEmployeeId}
                  onValueChange={setSelectedEmployeeId}
                />
              </div>
            )}
            <Button
              variant={year === 2025 ? 'primary' : 'secondary'}
              onClick={() => setYear(2025)}
            >
              2025
            </Button>
            <Button
              variant={year === 2026 ? 'primary' : 'secondary'}
              onClick={() => setYear(2026)}
            >
              2026
            </Button>
            <Button variant="accent" onClick={requestLeave} disabled={!selectedStartDate}>
              Request leave
            </Button>
          </div>
        }
      />

      <TimeOffNavTabs />
      <div className="space-y-6 px-5 pb-6">

        <Card>
          <CardHeader
            title="Year calendar"
            subtitle={`${year}-01-01 — ${year}-12-31`}
          />
          <CardBody>
            <YearCalendar
              year={year}
              days={data.days ?? []}
              types={typesForCalendar}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              onDateClick={handleCalendarDateClick}
            />
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader title="Entitlements" />
            <CardBody className="space-y-6">
              {entitlements.map((e) => (
                <DonutRing
                  key={e.timeOffType.id}
                  label={e.timeOffType.name}
                  value={parseFloat(e.taken)}
                  total={parseFloat(e.allocated)}
                  unit={e.timeOffType.unit === 'hours' ? 'h' : ''}
                  color={e.timeOffType.color}
                />
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Unplanned absence" />
            <CardBody>
              <table className="w-full border-collapse text-body-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">Recorded in last 30 days</td>
                    <td className="py-2.5 text-right font-mono text-text">
                      {data.unplannedSummary.last30Days}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">Recorded in last 3 months</td>
                    <td className="py-2.5 text-right font-mono text-text">
                      {data.unplannedSummary.last3Months}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">Recorded in last 6 months</td>
                    <td className="py-2.5 text-right font-mono text-text">
                      {data.unplannedSummary.last6Months}
                    </td>
                  </tr>
                  <tr className="border-b border-border font-semibold">
                    <td className="py-2.5 text-text">Recorded this year</td>
                    <td className="py-2.5 text-right font-mono text-text">
                      {data.unplannedSummary.thisYear}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
