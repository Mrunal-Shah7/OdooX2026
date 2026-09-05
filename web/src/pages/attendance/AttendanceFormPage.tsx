import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
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
      { page: employeePage, pageSize: 10, q: employeeSearch },
    ],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(employeePage),
        pageSize: "10",
      });
      if (employeeSearch) qs.set("q", employeeSearch);
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
      setCheckIn(record.checkIn ? record.checkIn.slice(0, 16) : "");
      setCheckOut(record.checkOut ? record.checkOut.slice(0, 16) : "");
      setOvertimeHours(record.overtimeHours);
      setStatus(record.status);
      setNotes(record.notes ?? "");
    }
  }, [record]);

  // Derived worked hours preview
  let derivedWorkedHours = record ? record.workedHours : "0.00";
  if (checkIn && checkOut) {
    try {
      const ms = Math.max(
        0,
        new Date(checkOut).getTime() - new Date(checkIn).getTime(),
      );
      derivedWorkedHours = (ms / (1000 * 60 * 60)).toFixed(2);
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
    return (
      <div className="p-8 text-center text-text-muted">Loading record...</div>
    );
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
  const selectedEmployee = employeesData.find(
    (employee) => employee.id === employeeId,
  );
  const employeeName = isNew
    ? selectedEmployee
      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
      : "Not selected"
    : `${record?.employee.firstName} ${record?.employee.lastName}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardBody className="space-y-6">
              <h2 className="text-h4 font-semibold text-text">
                Record Details
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {canEdit ? (
                  <Field label="Employee">
                    {isNew ? (
                      <Select
                        options={employeesData.map((employee) => ({
                          value: employee.id,
                          label: `${employee.firstName} ${employee.lastName}`,
                        }))}
                        value={employeeId}
                        onValueChange={setEmployeeId}
                        searchable
                        searchPlaceholder="Search employees"
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
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    readOnly={!isNew || !canEdit}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Check in" help="Format: DD/MM/YYYY; HH:mm:ss">
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY; HH:mm:ss"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    readOnly={!canEdit}
                    className="font-mono"
                  />
                </Field>

                <Field label="Check out" help="Format: DD/MM/YYYY; HH:mm:ss">
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY; HH:mm:ss"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    readOnly={!canEdit}
                    className="font-mono"
                  />
                </Field>

                <Field label="Worked hours">
                  <Input
                    value={formatWorkedHours(derivedWorkedHours)}
                    readOnly
                    className="bg-surface-sunken font-mono"
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
        </div>

        <div className="space-y-6">
          {!isNew && record && (
            <Card>
              <CardBody className="space-y-4">
                <h3 className="text-label font-medium text-text-muted">
                  Status summary
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm text-text-muted">Status</span>
                    <Badge
                      variant={
                        status === "present"
                          ? "success"
                          : status === "absent"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-text-muted">
                      Modified manually
                    </span>
                    <Badge
                      variant={record.isManualEdit ? "warning" : "neutral"}
                    >
                      {record.isManualEdit ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-label font-medium text-text-muted">
                Overtime
              </h3>
              <Field label="Overtime hours">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  readOnly={!canEdit}
                  className="font-mono"
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
                      <Badge variant="neutral">
                        {status.replace("_", " ")}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={isNew ? "Before saving" : "Record context"} />
              <CardBody>
                {isNew ? (
                  <ul className="attendance-record-guidance">
                    <li>Select the employee and attendance date.</li>
                    <li>Check-in and check-out determine worked hours.</li>
                    <li>Use notes to explain a manual correction.</li>
                  </ul>
                ) : (
                  <dl className="attendance-record-summary">
                    {canEdit ? (
                      <>
                        <div className="attendance-record-summary__row">
                          <dt>Department</dt>
                          <dd>{record?.employee.departmentName}</dd>
                        </div>
                        <div className="attendance-record-summary__row">
                          <dt>Position</dt>
                          <dd>{record?.employee.jobPosition}</dd>
                        </div>
                        <div className="attendance-record-summary__row">
                          <dt>Work email</dt>
                          <dd className="attendance-record-summary__numeric">
                            {record?.employee.workEmail}
                          </dd>
                        </div>
                      </>
                    ) : null}
                    <div className="attendance-record-summary__row">
                      <dt>Entry source</dt>
                      <dd>
                        {record?.isManualEdit
                          ? "Manually edited"
                          : "Recorded attendance"}
                      </dd>
                    </div>
                  </dl>
                )}
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
