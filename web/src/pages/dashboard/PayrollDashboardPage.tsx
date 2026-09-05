import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "../../components/layout/PageHeader";
import { PayrollNavTabs } from "../../components/layout/PayrollNavTabs";
import { Select } from "../../components/ui/Select";
import { BarChartCard } from "../../components/charts/BarChartCard";
import { LineChartCard } from "../../components/charts/LineChartCard";
import { Amount } from "../../components/ui/Amount";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Spinner } from "../../components/ui/Spinner";
import { formatMoney } from "../../lib/format";
import { cn } from "../../lib/cn";

type PayrollDashboardData = {
  period: string;
  kpis: {
    totalNetPaid: string;
    currency: "INR" | "USD";
    netChangePercent: string;
    payslipsGenerated: number;
    payslipsPaid: number;
    payslipsPending: number;
    averageSalary: string;
    approvedTimeOffDays: string;
    attendanceHealthPercent: string;
  };
  salaryByDepartment: {
    departmentId: string;
    departmentName: string;
    headcount: number;
    totalNet: string;
  }[];
  monthlyTrend: {
    period: string;
    totalNet: string;
  }[];
  statusSplit: {
    paid: number;
    done: number;
    computed: number;
    draft: number;
  };
  alerts: {
    code: string;
    message: string;
    count: number;
    linkPath: string | null;
  }[];
  attendanceOverview: {
    present: number;
    late: number;
    absent: number;
    overtimeHours: string;
    missingCheckOuts: number;
    manualEdits: number;
    coveragePercent: string;
  };
  timeOffOverview: {
    timeOffType: {
      id: string;
      name: string;
      code: string;
      color: string;
      unit: "days" | "hours";
    };
    approvedDays: string;
    pending: number;
    remainingBalance: string;
  }[];
};

async function fetchPayrollDashboard(
  params: Record<string, string>,
): Promise<PayrollDashboardData> {
  const searchParams = new URLSearchParams(params);
  const headers = new Headers({ "Content-Type": "application/json" });
  const userId = sessionStorage.getItem("pp360_user_id");
  if (userId) {
    headers.set("x-user-id", userId);
  }
  const res = await fetch(`/api/dashboard/payroll?${searchParams.toString()}`, {
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to load payroll dashboard");
  }
  const json = await res.json();
  return json.data;
}

async function fetchDepartments(): Promise<{ id: string; name: string }[]> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const userId = sessionStorage.getItem("pp360_user_id");
  if (userId) {
    headers.set("x-user-id", userId);
  }
  const res = await fetch("/api/departments?pageSize=100", {
    headers,
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

import { useSession } from "../../lib/session";
import { isPayrollRole } from "../../lib/permissions";

export default function PayrollDashboardPage() {
  const { user } = useSession();
  const canAccessPayroll = user && isPayrollRole(user.role);

  const [period, setPeriod] = useState("2026-09");
  const [departmentId, setDepartmentId] = useState("all");

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", "options"],
    queryFn: fetchDepartments,
    enabled: !!canAccessPayroll,
  });

  const queryParams: Record<string, string> = { period };
  if (departmentId !== "all") queryParams["departmentId"] = departmentId;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "payroll", queryParams],
    queryFn: () => fetchPayrollDashboard(queryParams),
    enabled: !!canAccessPayroll,
  });

  if (user && !canAccessPayroll) {
    return (
      <>
        <PageHeader title="Payroll dashboard" />
        <div className="p-8 text-center">
          <Card className="max-w-md mx-auto p-6 space-y-4">
            <h2 className="text-h2 font-semibold text-danger">403 Forbidden</h2>
            <p className="text-body-sm text-text-muted">
              Only payroll administrators and payroll users can access the
              payroll dashboard.
            </p>
          </Card>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PayrollNavTabs />
        <PageHeader
          title="Payroll dashboard"
          subtitle="Payments, staffing impact, leave patterns and attendance quality"
        />
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PayrollNavTabs />
        <PageHeader
          title="Payroll dashboard"
          subtitle="Payments, staffing impact, leave patterns and attendance quality"
        />
        <div className="px-5 py-12">
          <ErrorState
            message="Could not load payroll dashboard"
            onRetry={() => refetch()}
          />
        </div>
      </>
    );
  }

  const deptChartData = data.salaryByDepartment.map((dept) => ({
    name: dept.departmentName,
    value: Number(dept.totalNet),
    formattedValue: formatMoney(dept.totalNet, data.kpis.currency),
  }));

  const trendChartData = data.monthlyTrend.map((trend) => {
    const parts = trend.period.split("-");
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    return {
      name: monthName,
      value: Number(trend.totalNet),
      formattedValue: formatMoney(trend.totalNet, data.kpis.currency),
    };
  });

  const totalHeadcount = data.salaryByDepartment.reduce(
    (sum, d) => sum + d.headcount,
    0,
  );
  const totalSalaryNum = Number(data.kpis.totalNetPaid);
  const netChangeNum = Number(data.kpis.netChangePercent);

  return (
    <>
      <PageHeader title="Payroll dashboard" subtitle="September 2026" />
      <PayrollNavTabs />
      <div className="space-y-5 px-5 pb-6">
        <div className="flex gap-3">
          <Select
            options={[{ value: "2026-09", label: "September 2026" }]}
            value={period}
            onValueChange={setPeriod}
          />
          <Select
            options={[
              { value: "all", label: "All departments" },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            value={departmentId}
            onValueChange={setDepartmentId}
          />
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardBody>
              <span className="text-label font-medium text-text-muted">
                Total net paid
              </span>
              <div className="mt-1 font-mono text-metric font-semibold text-text">
                <Amount
                  value={data.kpis.totalNetPaid}
                  currency={data.kpis.currency}
                />
              </div>
              <span
                className={cn(
                  "mt-1 block text-caption",
                  netChangeNum >= 0
                    ? "font-medium text-success"
                    : "font-medium text-danger",
                )}
              >
                {netChangeNum >= 0
                  ? `+${data.kpis.netChangePercent}%`
                  : `${data.kpis.netChangePercent}%`}{" "}
                vs prior month
              </span>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <span className="text-label font-medium text-text-muted">
                Payslips generated
              </span>
              <div className="mt-1 font-mono text-metric font-semibold text-text">
                {data.kpis.payslipsGenerated}
              </div>
              <span className="mt-1 block text-caption text-text-muted">
                {data.kpis.payslipsPaid} paid · {data.kpis.payslipsPending}{" "}
                pending
              </span>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <span className="text-label font-medium text-text-muted">
                Average salary
              </span>
              <div className="mt-1 font-mono text-metric font-semibold text-text">
                <Amount
                  value={data.kpis.averageSalary}
                  currency={data.kpis.currency}
                />
              </div>
              <span className="mt-1 block text-caption text-text-muted">
                Across selected filters
              </span>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <span className="text-label font-medium text-text-muted">
                Approved time off
              </span>
              <div className="mt-1 font-mono text-metric font-semibold text-text">
                {data.kpis.approvedTimeOffDays}
              </div>
              <span className="mt-1 block text-caption text-text-muted">
                Days in selected period
              </span>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <span className="text-label font-medium text-text-muted">
                Attendance health
              </span>
              <div className="mt-1 font-mono text-metric font-semibold text-text">
                {data.kpis.attendanceHealthPercent}%
              </div>
              <span className="mt-1 block text-caption text-text-muted">
                Present of reviewed records
              </span>
            </CardBody>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarChartCard
            title="Salary cost by department"
            subtitle="payslips + department"
            data={deptChartData}
          />
          <LineChartCard
            title="Monthly net salary trend"
            subtitle="historical payslips"
            data={trendChartData}
          />
        </div>

        {/* 3 Summary Cards Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Card 1: Payroll alerts */}
          <Card>
            <CardHeader title="Payroll alerts" />
            <CardBody className="p-0">
              {data.alerts.length === 0 ? (
                <div className="p-4 text-body-sm text-text-muted">
                  No active payroll alerts
                </div>
              ) : (
                <table className="w-full border-collapse text-body-sm">
                  <tbody>
                    {data.alerts.map((alert) => (
                      <tr
                        key={alert.code}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-3 text-text">
                          {alert.linkPath ? (
                            <Link
                              to={alert.linkPath}
                              className="text-text no-underline hover:text-accent"
                            >
                              {alert.message}
                            </Link>
                          ) : (
                            alert.message
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-text">
                          {alert.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          {/* Card 2: Attendance overview */}
          <Card>
            <CardHeader title="Attendance overview" />
            <CardBody className="p-0">
              <table className="w-full border-collapse text-body-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text">Present</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {data.attendanceOverview.present}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text">Late</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {data.attendanceOverview.late}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text">Absent</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {data.attendanceOverview.absent}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text">Overtime hours</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {data.attendanceOverview.overtimeHours}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text">Missing check-outs</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {data.attendanceOverview.missingCheckOuts}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text">Manual edits</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {data.attendanceOverview.manualEdits}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="px-4 py-3 text-text">Coverage</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {data.attendanceOverview.coveragePercent}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Card 3: Time off overview */}
          <Card>
            <CardHeader title="Time off overview" />
            <CardBody className="p-0">
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right font-mono">Approved</th>
                    <th className="px-4 py-3 text-right font-mono">Pending</th>
                    <th className="px-4 py-3 text-right font-mono">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeOffOverview.map((row) => (
                    <tr
                      key={row.timeOffType.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 text-text">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-2 rounded-full"
                            style={{ background: row.timeOffType.color }}
                          />
                          <span>{row.timeOffType.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {row.approvedDays}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {row.pending}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text">
                        {row.remainingBalance !== null &&
                        row.remainingBalance !== ""
                          ? row.remainingBalance
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        {/* Department Overview Table */}
        <Card>
          <CardHeader
            title="Department overview"
            subtitle="employees + contracts + payslips"
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken text-left text-label text-text-muted">
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-right font-mono">
                      Headcount
                    </th>
                    <th className="px-4 py-3 text-right font-mono">
                      Monthly salary
                    </th>
                    <th className="px-4 py-3 text-right font-mono">
                      Share of cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.salaryByDepartment.map((dept) => {
                    const share =
                      totalSalaryNum > 0
                        ? `${Math.round((Number(dept.totalNet) / totalSalaryNum) * 100)}%`
                        : "0%";
                    return (
                      <tr
                        key={dept.departmentId}
                        className="border-b border-border"
                      >
                        <td className="px-4 py-3 font-medium text-text">
                          {dept.departmentName}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text">
                          {dept.headcount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text">
                          <Amount
                            value={dept.totalNet}
                            currency={data.kpis.currency}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text">
                          {share}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="px-4 py-3 text-text">Total</td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      {totalHeadcount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      <Amount
                        value={data.kpis.totalNetPaid}
                        currency={data.kpis.currency}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
