
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeOffNavTabs } from '../../components/layout/TimeOffNavTabs';
import { useNavigate } from '@tanstack/react-router';
import { DonutRing } from '../../components/charts/DonutRing';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

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
    workingHoursPerDay: string;
    breakPolicy: string;
    days: { dayOfWeek: number; dayType: string }[];
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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user?.employee?.id ?? 'my_records');
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  const canSwitchEmployee = user ? isHrManagerOrAbove(user.role) : false;

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
    enabled: canSwitchEmployee,
  });

  const queryUrl = `/api/time-off/dashboard?year=${year}${
    selectedEmployeeId && selectedEmployeeId !== 'my_records' ? `&employeeId=${selectedEmployeeId}` : ''
  }`;

  const { data, isLoading, isError, refetch } = useQuery<TimeOffDashboardData>({
    queryKey: ['timeOff', 'dashboard', year, selectedEmployeeId],
    queryFn: () => apiRequest<TimeOffDashboardData>(queryUrl),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 px-5 pb-6 pt-6">
        <div className="h-16 w-full rounded-md bg-surface-sunken"></div>
        <div className="h-[400px] w-full rounded-md bg-surface-sunken"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-48 rounded-md bg-surface-sunken"></div>
          <div className="h-48 rounded-md bg-surface-sunken"></div>
        </div>
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
                <SearchableSelect
                  options={[
                    { value: user?.employee?.id ?? 'my_records', label: 'My records' },
                    ...employeesList.map((e) => ({
                      value: e.id,
                      label: `${e.firstName} ${e.lastName}`,
                    })),
                    ...(hasMoreEmployees
                      ? [{ value: 'load_more', label: isFetchingEmployees ? 'Loading...' : 'Show more' }]
                      : []),
                  ]}
                  value={selectedEmployeeId}
                  onValueChange={(val) => {
                    if (val === 'load_more') {
                      setEmployeePage((p) => p + 1);
                      return;
                    }
                    setSelectedEmployeeId(val);
                  }}
                  onSearch={setEmployeeSearch}
                  loading={isFetchingEmployees}
                />
              </div>
            )}
            <Button
              variant={year === 2025 ? 'primary' : 'secondary'}
              className={`${year === 2025 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-secondary text-text hover:bg-secondary/90'}`}
              onClick={() => setYear(2025)}
            >
              2025
            </Button>
            <Button
              variant={year === 2026 ? 'primary' : 'secondary'}
              className={`${year === 2026 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-secondary text-text hover:bg-secondary/90'}`}
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
                  key={`${data.employee.id}-${e.timeOffType.id}`}
                  label={e.timeOffType.name}
                  value={parseFloat(e.taken)}
                  total={parseFloat(e.allocated)}
                  unit={e.timeOffType.unit === 'hours' ? 'h' : ''}
                  color={e.timeOffType.color}
                  isUnlimited={e.timeOffType.code === 'UL'}
                />
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Working Schedule & Details" />
            <CardBody>
              <table className="w-full border-collapse text-body-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">Assigned Schedule</td>
                    <td className="py-2.5 text-right font-medium text-text">
                      {data.workingSchedule.name}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">Weekly Hours</td>
                    <td className="py-2.5 text-right font-mono text-text">
                      {data.workingSchedule.hoursPerWeek}h
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">Daily Hours</td>
                    <td className="py-2.5 text-right font-mono text-text">
                      {data.workingSchedule.workingHoursPerDay}h
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">Working Days</td>
                    <td className="py-2.5 text-right text-text">
                      {data.workingSchedule.days
                        .filter((d) => d.dayType === 'working' || d.dayType === 'morning' || d.dayType === 'afternoon')
                        .map((d) => {
                          const wdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          return wdays[d.dayOfWeek];
                        })
                        .join(', ')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-text-muted">Department</td>
                    <td className="py-2.5 text-right text-text">
                      {data.employee.departmentName}
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
