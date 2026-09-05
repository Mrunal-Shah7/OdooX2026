import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TimeOffNavTabs } from '../../components/layout/TimeOffNavTabs';
import { useNavigate } from '@tanstack/react-router';
import { DonutRing } from '../../components/charts/DonutRing';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Select } from '../../components/ui/Select';
import { PageSkeleton } from '../../components/ui/Skeleton';

import { isHrManagerOrAbove } from '../../lib/permissions';
import { useSession } from '../../lib/session';
import { YearCalendar, type TimeOffCalendarDay } from './YearCalendar';

const monthOptions = [
  { value: '', label: 'All months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const yearOptions = Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, index) => {
  const year = String(new Date().getFullYear() - index);
  return { value: year, label: year };
});

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

type PendingTimeOffRequest = {
  id: string;
  timeOffType: {
    id: string;
    name: string;
    color: string;
  };
  startDate: string;
  endDate: string;
  durationType: 'full_day' | 'half_day' | 'hours';
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
  const [selectedMonth, setSelectedMonth] = useState('');
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

  const calendarEmployeeId = selectedEmployeeId || data?.employee.id;

  const { data: pendingRequests } = useQuery<PendingTimeOffRequest[]>({
    queryKey: ['timeOff', 'requests', 'pending', year, calendarEmployeeId],
    queryFn: () => {
      const query = new URLSearchParams({
        status: 'to_approve',
        dateFrom: `${year}-01-01`,
        dateTo: `${year}-12-31`,
        pageSize: '100',
        ...(calendarEmployeeId ? { employeeId: calendarEmployeeId } : {}),
      });
      return apiRequest<PendingTimeOffRequest[]>(`/api/time-off/requests?${query.toString()}`);
    },
    enabled: Boolean(calendarEmployeeId),
  });

  const calendarDays = useMemo(() => {
    const requests = pendingRequests ?? [];
    return (data?.days ?? []).map((day) => {
      const pendingRequest = requests.find(
        (request) =>
          day.kind === 'working' &&
          day.date >= request.startDate &&
          day.date <= request.endDate,
      );

      if (!pendingRequest) return day;

      return {
        ...day,
        kind: 'leave' as const,
        timeOffTypeId: pendingRequest.timeOffType.id,
        color: pendingRequest.timeOffType.color,
        fraction: pendingRequest.durationType === 'half_day' ? '0.50' : '1.00',
        label: pendingRequest.timeOffType.name,
        isPending: true,
      };
    });
  }, [data?.days, pendingRequests]);

  if (isLoading) {
    return <PageSkeleton />;
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
            <div className="w-32">
              <Select options={monthOptions} value={selectedMonth} onValueChange={setSelectedMonth} />
            </div>
            <div className="w-24">
              <Select
                options={yearOptions}
                value={String(year)}
                onValueChange={(value) => setYear(Number(value))}
              />
            </div>
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
            subtitle={selectedMonth ? `${year}-${selectedMonth.padStart(2, '0')}` : `${year}-01-01 — ${year}-12-31`}
          />
          <CardBody>
            <YearCalendar
              year={year}
              selectedMonth={selectedMonth ? Number(selectedMonth) : undefined}
              days={calendarDays}
              types={typesForCalendar}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              onDateClick={handleCalendarDateClick}
            />
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader title="Entitlements" subtitle="Taken, pending and remaining leave balance" />
            <CardBody className="space-y-6">
              {entitlements.map((e) => (
                <DonutRing
                  key={`${data.employee.id}-${e.timeOffType.id}`}
                  label={e.timeOffType.name}
                  value={parseFloat(e.taken)}
                  total={parseFloat(e.allocated)}
                  pending={parseFloat(e.pending)}
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
