import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TimeOffNavTabs } from "../../components/layout/TimeOffNavTabs";
import { useNavigate } from "@tanstack/react-router";
import { DonutRing } from "../../components/charts/DonutRing";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { Select } from "../../components/ui/Select";
import { PageSkeleton } from "../../components/ui/Skeleton";

import { isHrManagerOrAbove } from "../../lib/permissions";
import { useSession } from "../../lib/session";
import { showToast } from "../../lib/toast";
import {
  YearCalendar,
  YearCalendarSkeleton,
  type TimeOffCalendarDay,
} from "./YearCalendar";

const monthOptions = [
  { value: "", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const yearOptions = Array.from(
  { length: new Date().getFullYear() - 2010 + 1 },
  (_, index) => {
    const year = String(new Date().getFullYear() - index);
    return { value: year, label: year };
  },
);

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
      unit: "days" | "hours";
      color: string;
    };
    allocated: string;
    taken: string;
    remaining: string;
    pending: string;
  }[];
};

async function apiRequest<T>(path: string): Promise<T> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const userId = sessionStorage.getItem("pp360_user_id");
  if (userId) {
    headers.set("x-user-id", userId);
  }
  const res = await fetch(path, { headers, credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Request failed");
  }
  const json = await res.json();
  return json.data;
}

export default function TimeOffDashboardPage() {
  const { user } = useSession();
  const navigate = useNavigate();

  const [year, setYear] = useState(2026);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    user?.employee?.id ?? "my_records",
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  const canSwitchEmployee = user ? isHrManagerOrAbove(user.role) : false;

  const [employeePage, setEmployeePage] = useState(1);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeesList, setEmployeesList] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);
  const [hasMoreEmployees, setHasMoreEmployees] = useState(false);

  useEffect(() => {
    setEmployeePage(1);
    setEmployeesList([]);
  }, [employeeSearch]);

  const { isFetching: isFetchingEmployees } = useQuery({
    queryKey: [
      "employees",
      { page: employeePage, pageSize: 8, q: employeeSearch },
    ],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(employeePage),
        pageSize: "8",
      });
      if (employeeSearch) qs.set("q", employeeSearch);
      const headers = new Headers({ "Content-Type": "application/json" });
      const userId = sessionStorage.getItem("pp360_user_id");
      if (userId) headers.set("x-user-id", userId);
      const response = await fetch(`/api/employees?${qs.toString()}`, {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to load employees");
      const result = await response.json();
      const data = result.data;
      const meta = result.meta;
      if (data) {
        setEmployeesList((prev) => {
          const merged = [...prev, ...data];
          return Array.from(new Map(merged.map((e) => [e.id, e])).values());
        });
        setHasMoreEmployees(meta ? meta.page * meta.pageSize < meta.total : false);
      }
      return result;
    },
    enabled: canSwitchEmployee,
  });

  const queryUrl = `/api/time-off/dashboard?year=${year}${
    selectedEmployeeId && selectedEmployeeId !== "my_records"
      ? `&employeeId=${selectedEmployeeId}`
      : ""
  }`;

  const { data, isLoading, isFetching, isError, refetch } =
    useQuery<TimeOffDashboardData>({
      queryKey: ["timeOff", "dashboard", year, selectedEmployeeId],
      queryFn: () => apiRequest<TimeOffDashboardData>(queryUrl),
      placeholderData: (previousData) => previousData,
    });

  const calendarDays = data?.days ?? [];

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="px-5 py-12">
        <ErrorState
          message="Could not load time off dashboard"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const entitlements = data.entitlements ?? [];
  const ptoEntitlement = entitlements.find(
    (e) => e?.timeOffType?.code === "PTO",
  );
  const ptoPending = parseFloat(ptoEntitlement?.pending ?? "0");
  const ptoRemaining = parseFloat(ptoEntitlement?.remaining ?? "0");
  const ptoAvailable = Math.max(0, ptoRemaining - ptoPending).toFixed(2);

  const typesForCalendar = entitlements.map((e) => ({
    id: e.timeOffType.id,
    name: e.timeOffType.name,
    color: e.timeOffType.color,
  }));

  const handleCalendarDateClick = (date: string) => {
    const d = new Date(`${date}T00:00:00.000Z`);
    const day = d.getUTCDay();
    if (day === 0 || day === 6) {
      showToast({
        type: "warning",
        title: "Invalid Selection",
        message:
          "Weekends (Saturday and Sunday) cannot be selected for leave requests.",
      });
      return;
    }

    const dayData = (data?.days ?? []).find((x) => x.date === date);
    if (dayData?.kind === "holiday") {
      showToast({
        type: "warning",
        title: "Invalid Selection",
        message: `${dayData.label ?? "Public holiday"} cannot be selected for leave requests.`,
      });
      return;
    }

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
      to: "/time-off/requests/$id",
      params: { id: "new" },
      search: {
        startDate: selectedStartDate,
        endDate: selectedEndDate ?? selectedStartDate,
        ...(selectedEmployeeId && selectedEmployeeId !== "my_records"
          ? { employeeId: selectedEmployeeId }
          : {}),
      },
    });
  };

  const handleYearChange = (value: string) => {
    setYear(Number(value));
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  const isCalendarRefreshing = isFetching;

  return (
    <>
      <PageHeader
        title="My time off"
        subtitle={`${data.employee.firstName} ${data.employee.lastName} · ${data.workingSchedule.name} · ${ptoAvailable} days available${ptoPending > 0 ? ` (${ptoEntitlement?.pending} pending)` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canSwitchEmployee && (
              <div className="w-48">
                <SearchableSelect
                  options={[
                    {
                      value: user?.employee?.id ?? "my_records",
                      label: "My records",
                    },
                    ...employeesList.map((e) => ({
                      value: e.id,
                      label: `${e.firstName} ${e.lastName}`,
                    })),
                    ...(hasMoreEmployees
                      ? [
                          {
                            value: "load_more",
                            label: isFetchingEmployees
                              ? "Loading..."
                              : "Show more",
                          },
                        ]
                      : []),
                  ]}
                  value={selectedEmployeeId}
                  onValueChange={(val) => {
                    if (val === "load_more") {
                      setEmployeePage((p) => p + 1);
                      return;
                    }
                    setSelectedEmployeeId(val);
                    setSelectedStartDate(null);
                    setSelectedEndDate(null);
                  }}
                  onSearch={setEmployeeSearch}
                  loading={isFetchingEmployees}
                />
              </div>
            )}
            <div className="w-32">
              <Select
                options={monthOptions}
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              />
            </div>
            <div className="w-24">
              <Select
                options={yearOptions}
                value={String(year)}
                onValueChange={handleYearChange}
              />
            </div>
            <Button
              variant="accent"
              onClick={requestLeave}
              disabled={!selectedStartDate}
            >
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
            subtitle={
              selectedMonth
                ? `${year}-${selectedMonth.padStart(2, "0")}`
                : `${year}-01-01 — ${year}-12-31`
            }
          />
          <CardBody>
            {isCalendarRefreshing ? (
              <YearCalendarSkeleton
                selectedMonth={
                  selectedMonth ? Number(selectedMonth) : undefined
                }
              />
            ) : (
              <YearCalendar
                year={year}
                selectedMonth={
                  selectedMonth ? Number(selectedMonth) : undefined
                }
                days={calendarDays}
                types={typesForCalendar}
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                onDateClick={handleCalendarDateClick}
              />
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader
              title="Entitlements"
              subtitle="Taken, pending and remaining leave balance"
            />
            <CardBody className="space-y-6">
              {entitlements
                .filter((e) => {
                  const hasAllocation = parseFloat(e.allocated) > 0;
                  const hasActivity =
                    parseFloat(e.taken) > 0 || parseFloat(e.pending) > 0;
                  const isStandardType =
                    e.timeOffType.code === "PTO" ||
                    e.timeOffType.code === "SICK" ||
                    e.timeOffType.code === "UNPAID";
                  return hasAllocation || isStandardType || hasActivity;
                })
                .map((e) => {
                  const isUnpaid = e.timeOffType.code === "UNPAID";
                  return (
                    <DonutRing
                      key={`${data.employee.id}-${e.timeOffType.id}`}
                      label={e.timeOffType.name}
                      value={parseFloat(e.taken)}
                      total={parseFloat(e.allocated)}
                      pending={parseFloat(e.pending)}
                      unit={e.timeOffType.unit === "hours" ? "h" : ""}
                      color={e.timeOffType.color}
                      isUnpaid={isUnpaid}
                    />
                  );
                })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Working Schedule & Details" />
            <CardBody>
              <table className="w-full border-collapse text-body-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2.5 text-text-muted">
                      Assigned Schedule
                    </td>
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
                        .filter(
                          (d) =>
                            d.dayType === "working" ||
                            d.dayType === "morning" ||
                            d.dayType === "afternoon",
                        )
                        .map((d) => {
                          const wdays = [
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ];
                          return wdays[d.dayOfWeek];
                        })
                        .join(", ")}
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
