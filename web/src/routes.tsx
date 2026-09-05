import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  isRedirect,
  Outlet,
} from '@tanstack/react-router';
import { AppShell } from './components/layout/AppShell';
import { apiClient } from './lib/apiClient';
import { clearStoredUserId, homePathForRole } from './lib/session';
import { isHrManagerOrAbove } from './lib/permissions';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import SetPasswordPage from './pages/auth/SetPasswordPage';
import EmployeeDirectoryPage from './pages/employees/EmployeeDirectoryPage';
import EmployeeFormPage from './pages/employees/EmployeeFormPage';
import DepartmentsPage from './pages/employees/DepartmentsPage';
import ContractsPage from './pages/contracts/ContractsPage';
import ContractFormPage from './pages/contracts/ContractFormPage';
import SchedulesPage from './pages/schedules/SchedulesPage';
import ScheduleFormPage from './pages/schedules/ScheduleFormPage';
import HolidaysPage from './pages/schedules/HolidaysPage';
import AttendancePage from './pages/attendance/AttendancePage';
import AttendanceFormPage from './pages/attendance/AttendanceFormPage';
import TimeOffDashboardPage from './pages/timeoff/TimeOffDashboardPage';
import RequestsPage from './pages/timeoff/RequestsPage';
import RequestFormPage from './pages/timeoff/RequestFormPage';
import TypesPage from './pages/timeoff/TypesPage';
import TypeFormPage from './pages/timeoff/TypeFormPage';
import AllocationsPage from './pages/timeoff/AllocationsPage';
import AllocationFormPage from './pages/timeoff/AllocationFormPage';
import PayrollDashboardPage from './pages/dashboard/PayrollDashboardPage';
import PayrunsPage from './pages/payroll/PayrunsPage';
import PayrunDetailPage from './pages/payroll/PayrunDetailPage';
import PayslipsPage from './pages/payroll/PayslipsPage';
import PayslipDetailPage from './pages/payroll/PayslipDetailPage';
import StructuresPage from './pages/payroll/StructuresPage';
import StructureFormPage from './pages/payroll/StructureFormPage';
import RulesPage from './pages/payroll/RulesPage';
import RuleFormPage from './pages/payroll/RuleFormPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthSkeleton, PageSkeleton } from './components/ui/Skeleton';

/** Validate session cookies via /me. Clears local hint on failure. */
async function requireAuthUser() {
  try {
    return await apiClient.getCurrentUser();
  } catch {
    clearStoredUserId();
    throw redirect({ to: '/login' });
  }
}

async function requireTimeOffManagementAccess() {
  const user = await requireAuthUser();
  if (!isHrManagerOrAbove(user.role)) {
    throw redirect({ to: '/time-off' });
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: async () => {
    try {
      await apiClient.getCurrentUser();
      throw redirect({ to: '/profile' });
    } catch (err) {
      if (isRedirect(err)) throw err;
      clearStoredUserId();
    }
  },
  pendingMs: 0,
  pendingComponent: AuthSkeleton,
  component: LoginPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const setPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/set-password',
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: SetPasswordPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const user = await requireAuthUser();
    throw redirect({ to: homePathForRole(user.role) });
  },
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: async () => {
    await requireAuthUser();
  },
  pendingMs: 0,
  pendingComponent: PageSkeleton,
  component: AppShell,
});

const employeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/employees',
  component: EmployeeDirectoryPage,
});

const employeeFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/employees/$id',
  component: EmployeeFormPage,
});

const departmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/departments',
  component: DepartmentsPage,
});

const contractsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/contracts',
  component: ContractsPage,
});

const contractFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/contracts/$id',
  component: ContractFormPage,
});

const schedulesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/schedules',
  component: SchedulesPage,
});

const scheduleFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/schedules/$id',
  component: ScheduleFormPage,
});

const holidaysRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/holidays',
  component: HolidaysPage,
});

const attendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/attendance',
  component: AttendancePage,
});

const attendanceFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/attendance/$id',
  component: AttendanceFormPage,
});

const timeOffRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/time-off',
  component: TimeOffDashboardPage,
});

const timeOffRequestsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/time-off/requests',
  component: RequestsPage,
});

const timeOffRequestFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/time-off/requests/$id',
  component: RequestFormPage,
});

const timeOffTypesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/time-off/types',
  beforeLoad: requireTimeOffManagementAccess,
  component: TypesPage,
});

const timeOffTypeFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/time-off/types/$id',
  beforeLoad: requireTimeOffManagementAccess,
  component: TypeFormPage,
});

const timeOffAllocationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/time-off/allocations',
  component: AllocationsPage,
});

const timeOffAllocationFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/time-off/allocations/$id',
  component: AllocationFormPage,
});

const payrollRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll',
  component: PayrollDashboardPage,
});

const payrunsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/payruns',
  component: PayrunsPage,
});

const payrunDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/payruns/$id',
  component: PayrunDetailPage,
});

const payslipsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/payslips',
  component: PayslipsPage,
});

const payslipDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/payslips/$id',
  component: PayslipDetailPage,
});

const structuresRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/structures',
  component: StructuresPage,
});

const structureFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/structures/$id',
  component: StructureFormPage,
});

const rulesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/rules',
  component: RulesPage,
});

const ruleFormRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll/rules/$id',
  component: RuleFormPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/reports',
  component: ReportsPage,
});

const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/users',
  beforeLoad: () => {
    throw redirect({ to: '/employees' });
  },
});

const notificationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/notifications',
  component: NotificationsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/profile',
  component: ProfilePage,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  forgotPasswordRoute,
  setPasswordRoute,
  appRoute.addChildren([
    employeesRoute,
    employeeFormRoute,
    departmentsRoute,
    contractsRoute,
    contractFormRoute,
    schedulesRoute,
    scheduleFormRoute,
    holidaysRoute,
    attendanceRoute,
    attendanceFormRoute,
    timeOffRoute,
    timeOffRequestsRoute,
    timeOffRequestFormRoute,
    timeOffTypesRoute,
    timeOffTypeFormRoute,
    timeOffAllocationsRoute,
    timeOffAllocationFormRoute,
    payrollRoute,
    payrunsRoute,
    payrunDetailRoute,
    payslipsRoute,
    payslipDetailRoute,
    structuresRoute,
    structureFormRoute,
    rulesRoute,
    ruleFormRoute,
    reportsRoute,
    usersRoute,
    notificationsRoute,
    profileRoute,
  ]),
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
