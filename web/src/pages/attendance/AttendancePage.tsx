import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatWorkedHours } from "../../lib/format";
import { isHrManagerOrAbove } from "../../lib/permissions";
import { useSession } from "../../lib/session";

type AttendanceStatus = "present" | "late" | "absent" | "half_day" | "on_leave";

type AttendanceItem = {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    jobPosition: string;
    departmentName: string;
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: string;
  overtimeHours: string;
  status: AttendanceStatus;
  notes: string | null;
  isManualEdit: boolean;
};

type AttendanceListResponse = {
  data: AttendanceItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PAGE_SIZE = 100;

async function fetchAttendancePage(
  params: Record<string, string>,
): Promise<AttendanceListResponse> {
  const searchParams = new URLSearchParams(params);
  const headers = new Headers({ "Content-Type": "application/json" });
  const userId = sessionStorage.getItem("pp360_user_id");
  if (userId) {
    headers.set("x-user-id", userId);
  }
  const res = await fetch(`/api/attendance?${searchParams.toString()}`, {
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load attendance records");
  }
  return res.json();
}

async function fetchAttendanceMonth(
  params: Record<string, string>,
): Promise<AttendanceListResponse> {
  const firstPage = await fetchAttendancePage({
    ...params,
    page: "1",
    pageSize: String(PAGE_SIZE),
  });
  const pageCount = Math.ceil(firstPage.meta.total / PAGE_SIZE);

  if (pageCount <= 1) {
    return firstPage;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchAttendancePage({
        ...params,
        page: String(index + 2),
        pageSize: String(PAGE_SIZE),
      }),
    ),
  );

  return {
    data: [firstPage, ...remainingPages].flatMap((response) => response.data),
    meta: firstPage.meta,
  };
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatStatus(status: AttendanceStatus): string {
  return status.replace("_", " ");
}

function getStatusBadgeVariant(status: AttendanceStatus) {
  switch (status) {
    case "present":
      return "success";
    case "late":
      return "warning";
    case "absent":
      return "danger";
    case "half_day":
    case "on_leave":
      return "info";
  }
}

function getDayStatus(
  records: AttendanceItem[],
): AttendanceStatus | "mixed" | "empty" {
  if (records.length === 0) return "empty";
  const firstStatus = records[0].status;
  return records.every((record) => record.status === firstStatus)
    ? firstStatus
    : "mixed";
}

function getMonthDates(
  month: Date,
): Array<{ date: string; dayNumber: number } | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - offset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;
    return {
      date: formatDateKey(new Date(year, monthIndex, dayNumber)),
      dayNumber,
    };
  });
}

export default function AttendancePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const canManage = user ? isHrManagerOrAbove(user.role) : false;

  const monthStart = formatDateKey(visibleMonth);
  const monthEnd = formatDateKey(
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0),
  );
  const employeeId = new URLSearchParams(window.location.search).get(
    "employeeId",
  );
  const queryParams: Record<string, string> = {
    dateFrom: monthStart,
    dateTo: monthEnd,
  };
  if (employeeId) {
    queryParams.employeeId = employeeId;
  }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["attendance", "calendar", queryParams],
    queryFn: () => fetchAttendanceMonth(queryParams),
  });

  const records = useMemo(() => data?.data ?? [], [data]);
  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, AttendanceItem[]>();
    for (const record of records) {
      const dateRecords = grouped.get(record.date) ?? [];
      dateRecords.push(record);
      grouped.set(record.date, dateRecords);
    }
    return grouped;
  }, [records]);
  const calendarDates = useMemo(
    () => getMonthDates(visibleMonth),
    [visibleMonth],
  );
  const selectedRecords = activeDate
    ? (recordsByDate.get(activeDate) ?? [])
    : [];
  const monthLabel = visibleMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (records.length === 0) {
      setActiveDate(null);
      return;
    }
    const today = formatDateKey(new Date());
    setActiveDate(recordsByDate.has(today) ? today : records[0].date);
  }, [records, recordsByDate]);

  const summary = useMemo(
    () => ({
      total: records.length,
      present: records.filter((record) => record.status === "present").length,
      late: records.filter((record) => record.status === "late").length,
      workedHours: records
        .reduce((total, record) => total + Number(record.workedHours), 0)
        .toFixed(2),
    }),
    [records],
  );

  function changeMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
    setActiveDate(null);
  }

  return (
    <>
      <PageHeader
        title="Attendance calendar"
        subtitle="Hover or focus a date to review attendance details."
        actions={
          canManage ? (
            <Button
              variant="accent"
              onClick={() =>
                navigate({ to: "/attendance/$id", params: { id: "new" } })
              }
            >
              Log attendance
            </Button>
          ) : undefined
        }
      />

      <div className="attendance-page__content">
        {!isError ? (
          <section
            className="attendance-summary"
            aria-label="Attendance summary"
          >
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Total records</span>
              <strong className="attendance-summary__value">
                {isLoading ? "—" : summary.total}
              </strong>
              <span className="attendance-summary__note">Selected month</span>
            </div>
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Present</span>
              <strong className="attendance-summary__value">
                {isLoading ? "—" : summary.present}
              </strong>
              <span className="attendance-summary__note">Selected month</span>
            </div>
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Late arrivals</span>
              <strong className="attendance-summary__value">
                {isLoading ? "—" : summary.late}
              </strong>
              <span className="attendance-summary__note">Selected month</span>
            </div>
            <div className="attendance-summary__item">
              <span className="attendance-summary__label">Worked hours</span>
              <strong className="attendance-summary__value">
                {isLoading ? "—" : summary.workedHours}
              </strong>
              <span className="attendance-summary__note">Selected month</span>
            </div>
          </section>
        ) : null}

        {isError ? (
          <Card>
            <ErrorState
              message="Could not load attendance records"
              onRetry={() => refetch()}
            />
          </Card>
        ) : (
          <Card className="attendance-calendar-card">
            <div className="attendance-calendar__header">
              <div>
                <h2>Monthly attendance</h2>
                <p className="font-mono">{monthLabel}</p>
              </div>
              <div className="attendance-calendar__month-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div
              className="attendance-calendar__legend"
              aria-label="Attendance status legend"
            >
              {(
                ["present", "late", "absent", "half_day", "on_leave"] as const
              ).map((status) => (
                <span key={status}>
                  <span
                    className={`attendance-calendar__legend-dot attendance-calendar__legend-dot--${status}`}
                  />
                  {formatStatus(status)}
                </span>
              ))}
            </div>

            {isLoading || isFetching ? (
              <div
                className="attendance-calendar__loading"
                role="status"
                aria-label="Loading attendance calendar"
              >
                <Skeleton className="skeleton--panel" />
                <Skeleton className="skeleton--side-panel" />
              </div>
            ) : (
              <div className="attendance-calendar__layout">
                <div
                  className="attendance-calendar__grid"
                  aria-label={`${monthLabel} attendance`}
                >
                  {WEEKDAYS.map((weekday) => (
                    <div key={weekday} className="attendance-calendar__weekday">
                      {weekday}
                    </div>
                  ))}
                  {calendarDates.map((day, index) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="attendance-calendar__day attendance-calendar__day--outside"
                        />
                      );
                    }

                    const dayRecords = recordsByDate.get(day.date) ?? [];
                    const dayStatus = getDayStatus(dayRecords);
                    const isActive = day.date === activeDate;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        className={`attendance-calendar__day attendance-calendar__day--${dayStatus}`}
                        data-active={isActive || undefined}
                        onMouseEnter={() => setActiveDate(day.date)}
                        onFocus={() => setActiveDate(day.date)}
                        onClick={() => setActiveDate(day.date)}
                        aria-label={`${day.date}: ${dayRecords.length} attendance ${dayRecords.length === 1 ? "record" : "records"}`}
                      >
                        <span className="attendance-calendar__day-number">
                          {day.dayNumber}
                        </span>
                        {dayRecords.length > 0 ? (
                          <>
                            <span className="attendance-calendar__day-count">
                              {dayRecords.length}{" "}
                              {dayRecords.length === 1 ? "record" : "records"}
                            </span>
                            <span
                              className="attendance-calendar__day-statuses"
                              aria-hidden="true"
                            >
                              {Array.from(
                                new Set(
                                  dayRecords.map((record) => record.status),
                                ),
                              ).map((status) => (
                                <span
                                  key={status}
                                  className={`attendance-calendar__status-dot attendance-calendar__status-dot--${status}`}
                                />
                              ))}
                            </span>
                          </>
                        ) : (
                          <span className="attendance-calendar__day-count">
                            No records
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <aside
                  className="attendance-calendar__details"
                  aria-live="polite"
                >
                  <div className="attendance-calendar__details-header">
                    <span>Day details</span>
                    <strong className="font-mono">
                      {activeDate ?? "Hover a date"}
                    </strong>
                  </div>
                  {selectedRecords.length > 0 ? (
                    <div className="attendance-calendar__record-list">
                      {selectedRecords.map((record) => (
                        <article
                          key={record.id}
                          className="attendance-calendar__record"
                        >
                          <div className="attendance-calendar__record-heading">
                            {canManage ? (
                              <div>
                                <strong>
                                  {record.employee.firstName}{" "}
                                  {record.employee.lastName}
                                </strong>
                                <span>{record.employee.departmentName}</span>
                              </div>
                            ) : (
                              <strong>Your attendance</strong>
                            )}
                            <Badge
                              variant={getStatusBadgeVariant(record.status)}
                            >
                              {formatStatus(record.status)}
                            </Badge>
                          </div>
                          <dl className="attendance-calendar__record-facts">
                            <div>
                              <dt>Check in</dt>
                              <dd>{formatTime(record.checkIn)}</dd>
                            </div>
                            <div>
                              <dt>Check out</dt>
                              <dd>{formatTime(record.checkOut)}</dd>
                            </div>
                            <div>
                              <dt>Worked</dt>
                              <dd>{formatWorkedHours(record.workedHours)}</dd>
                            </div>
                            <div>
                              <dt>Overtime</dt>
                              <dd>{formatWorkedHours(record.overtimeHours)}</dd>
                            </div>
                          </dl>
                          {record.notes ? <p>{record.notes}</p> : null}
                          <Link to="/attendance/$id" params={{ id: record.id }}>
                            Open record
                          </Link>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="attendance-calendar__details-empty">
                      <p>
                        {activeDate
                          ? "No attendance records were logged on this date."
                          : records.length === 0
                            ? `No attendance records were found for ${monthLabel}.`
                            : "Hover or focus a calendar date to see its records."}
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
