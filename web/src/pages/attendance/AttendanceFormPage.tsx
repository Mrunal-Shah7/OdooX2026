import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { DatePicker } from "../../components/ui/DatePicker";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { ErrorState } from "../../components/ui/ErrorState";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { Select } from "../../components/ui/Select";
import { FormSkeleton } from "../../components/ui/Skeleton";
import { formatWorkedHours, parseDateTimeInput } from "../../lib/format";
import { isHrManagerOrAbove } from "../../lib/permissions";
import { useSession } from "../../lib/session";
import { showToast } from "../../lib/toast";

type AttendanceRecord = {
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
  status: "present" | "late" | "absent" | "half_day" | "on_leave";
  notes: string | null;
  isManualEdit: boolean;
};

function toDateTimePickerValue(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const userId = sessionStorage.getItem("pp360_user_id");
  if (userId) {
    headers.set("x-user-id", userId);
  }
  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return json.data;
}

export default function AttendanceFormPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: routeId } = useParams({ strict: false });
  const id = routeId ?? "new";
  const isNew = id === "new";

  const canEdit = user ? isHrManagerOrAbove(user.role) : false;

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
    enabled: isNew && canEdit,
  });

  const {
    data: record,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attendance", id],
    queryFn: () => apiRequest<AttendanceRecord>(`/api/attendance/${id}`),
    enabled: !isNew,
  });

  // Form state
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("0.00");
  const [status, setStatus] = useState<
    "present" | "late" | "absent" | "half_day" | "on_leave"
  >("present");
  const [notes, setNotes] = useState("");

  // Prepopulate form when record loads
  useEffect(() => {
    if (record) {
      setEmployeeId(record.employee.id);
      setDate(record.date);
      setCheckIn(toDateTimePickerValue(record.checkIn));
      setCheckOut(toDateTimePickerValue(record.checkOut));
      setOvertimeHours(record.overtimeHours);
      setStatus(record.status);
      setNotes(record.notes ?? "");
    }
  }, [record]);

  // Derived worked hours preview
  let derivedWorkedHours = record ? record.workedHours : "0.00";
  if (checkIn && checkOut) {
    try {
      const inIso = parseDateTimeInput(checkIn);
      const outIso = parseDateTimeInput(checkOut);
      if (inIso && outIso) {
        const ms = Math.max(
          0,
          new Date(outIso).getTime() - new Date(inIso).getTime(),
        );
        derivedWorkedHours = (ms / (1000 * 60 * 60)).toFixed(2);
      }
    } catch {
      // ignore
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        checkIn: parseDateTimeInput(checkIn) ?? null,
        checkOut: parseDateTimeInput(checkOut) ?? null,
        overtimeHours,
        status,
        notes: notes.trim() || null,
      };

      if (isNew) {
        if (!employeeId) throw new Error("Please select an employee");
        payload["employeeId"] = employeeId;
        payload["date"] = date;
        return apiRequest("/api/attendance", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      return apiRequest(`/api/attendance/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      navigate({ to: "/attendance" });
    },
    onError: (err: any) => {
      showToast({
        type: "error",
        title: "Error",
        message: err.message || "Failed to save attendance",
      });
    },
  });

  if (!isNew && isLoading) {
    return <FormSkeleton />;
  }

  if (!isNew && isError) {
    return (
      <div className="p-8">
        <ErrorState message="Failed to load attendance record" />
      </div>
    );
  }

  const title = isNew
    ? "New attendance record"
    : canEdit
      ? `${record?.employee.firstName} ${record?.employee.lastName} · ${record?.date}`
      : `Attendance · ${record?.date}`;
  const subtitle = isNew
    ? "Record attendance manually"
    : canEdit
      ? `${record?.employee.departmentName} · ${record?.employee.jobPosition}`
      : "Review your attendance details";
  const selectedEmployee = employeesList.find(
    (employee) => employee.id === employeeId,
  );
  const employeeName = isNew
    ? selectedEmployee
      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
      : "Not selected"
    : `${record?.employee.firstName} ${record?.employee.lastName}`;

  return (
    <div className="attendance-form-page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate({ to: "/attendance" })}
            >
              Cancel
            </Button>
            {canEdit && (
              <Button
                variant="primary"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : isNew
                    ? "Create"
                    : "Save Changes"}
              </Button>
            )}
          </div>
        }
      />

      <div className="attendance-form-page__content">
        <div className="attendance-record-layout">
          <Card className="attendance-record-form-card">
            <CardBody className="space-y-6">
              <h2 className="text-h4 font-semibold text-text">
                Record Details
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {canEdit ? (
                  <Field label="Employee">
                    {isNew ? (
                      <SearchableSelect
                        options={[
                          ...employeesList.map((employee) => ({
                            value: employee.id,
                            label: `${employee.firstName} ${employee.lastName}`,
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
                        value={employeeId}
                        onValueChange={(val) => {
                          if (val === "load_more") {
                            setEmployeePage((p) => p + 1);
                            return;
                          }
                          setEmployeeId(val);
                        }}
                        onSearch={setEmployeeSearch}
                        loading={isFetchingEmployees}
                      />
                    ) : (
                      <Input
                        value={`${record?.employee.firstName} ${record?.employee.lastName}`}
                        readOnly
                        className="bg-surface-sunken"
                      />
                    )}
                  </Field>
                ) : null}

                <Field label="Date">
                  <DatePicker
                    mode="single"
                    value={date}
                    onChange={setDate}
                    readOnly={!isNew || !canEdit}
                    ariaLabel="Attendance date"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Check in">
                  <DateTimePicker
                    value={checkIn}
                    onChange={setCheckIn}
                    readOnly={!canEdit}
                    ariaLabel="Check in date and time"
                  />
                </Field>

                <Field label="Check out">
                  <DateTimePicker
                    value={checkOut}
                    onChange={setCheckOut}
                    readOnly={!canEdit}
                    ariaLabel="Check out date and time"
                  />
                </Field>

                <Field label="Worked hours">
                  <Input
                    value={formatWorkedHours(derivedWorkedHours)}
                    readOnly
                    className="bg-surface-sunken font-mono text-caption"
                  />
                </Field>

                <Field label="Overtime hours">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={overtimeHours}
                    onChange={(event) => setOvertimeHours(event.target.value)}
                    readOnly={!canEdit}
                    className="font-mono"
                  />
                </Field>
              </div>

              <Field label="Status">
                <Select
                  value={status}
                  onValueChange={(value) => {
                    if (
                      value === "present" ||
                      value === "late" ||
                      value === "absent" ||
                      value === "half_day" ||
                      value === "on_leave"
                    ) {
                      setStatus(value);
                    }
                  }}
                  disabled={!canEdit}
                  options={[
                    { value: "present", label: "Present" },
                    { value: "late", label: "Late" },
                    { value: "absent", label: "Absent" },
                    { value: "half_day", label: "Half Day" },
                    { value: "on_leave", label: "On Leave" },
                  ]}
                />
              </Field>

              <Field label="Notes (Optional)">
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-text focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Any context about this record..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  readOnly={!canEdit}
                />
              </Field>
            </CardBody>
          </Card>

          <aside
            className="attendance-record-sidebar"
            aria-label="Attendance record summary"
          >
            <Card>
              <CardHeader
                title="Record summary"
                subtitle="Updates as details change"
              />
              <CardBody>
                <dl className="attendance-record-summary">
                  {canEdit ? (
                    <div className="attendance-record-summary__row">
                      <dt>Employee</dt>
                      <dd>{employeeName}</dd>
                    </div>
                  ) : null}
                  <div className="attendance-record-summary__row">
                    <dt>Date</dt>
                    <dd className="attendance-record-summary__numeric">
                      {date || "Not set"}
                    </dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Check in</dt>
                    <dd className="attendance-record-summary__numeric">
                      {checkIn ? checkIn.replace("T", " ") : "Not set"}
                    </dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Check out</dt>
                    <dd className="attendance-record-summary__numeric">
                      {checkOut ? checkOut.replace("T", " ") : "Not set"}
                    </dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Worked hours</dt>
                    <dd className="attendance-record-summary__numeric">
                      {derivedWorkedHours} h
                    </dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Overtime</dt>
                    <dd className="attendance-record-summary__numeric">
                      {overtimeHours || "0.00"} h
                    </dd>
                  </div>
                  <div className="attendance-record-summary__row">
                    <dt>Status</dt>
                    <dd>
                      <Badge
                        variant={
                          status === "present"
                            ? "success"
                            : status === "absent"
                              ? "danger"
                              : status === "late"
                                ? "warning"
                                : "info"
                        }
                      >
                        {status.replace("_", " ")}
                      </Badge>
                    </dd>
                  </div>
                  {!isNew && record ? (
                    <>
                      <div className="attendance-record-summary__row">
                        <dt>Modified manually</dt>
                        <dd>
                          <Badge
                            variant={record.isManualEdit ? "warning" : "neutral"}
                          >
                            {record.isManualEdit ? "Yes" : "No"}
                          </Badge>
                        </dd>
                      </div>
                      {canEdit ? (
                        <>
                          <div className="attendance-record-summary__row">
                            <dt>Department</dt>
                            <dd>{record.employee.departmentName}</dd>
                          </div>
                          <div className="attendance-record-summary__row">
                            <dt>Position</dt>
                            <dd>{record.employee.jobPosition}</dd>
                          </div>
                          <div className="attendance-record-summary__row">
                            <dt>Work email</dt>
                            <dd className="attendance-record-summary__numeric">
                              {record.employee.workEmail}
                            </dd>
                          </div>
                        </>
                      ) : null}
                      <div className="attendance-record-summary__row">
                        <dt>Entry source</dt>
                        <dd>
                          {record.isManualEdit
                            ? "Manually edited"
                            : "Recorded attendance"}
                        </dd>
                      </div>
                    </>
                  ) : null}
                </dl>
                {isNew ? (
                  <ul className="attendance-record-guidance mt-4 border-t border-border pt-4">
                    <li>Select the employee and attendance date.</li>
                    <li>Check-in and check-out determine worked hours.</li>
                    <li>Use notes to explain a manual correction.</li>
                  </ul>
                ) : null}
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
