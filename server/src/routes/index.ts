import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import employeesRoutes from './employees.routes.js';
import contractsRoutes from './contracts.routes.js';
import schedulesRoutes from './schedules.routes.js';
import attendanceRoutes from './attendance.routes.js';
import timeoffRoutes from './timeoff.routes.js';
import payrollRoutes from './payroll.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reportsRoutes from './reports.routes.js';
import notificationsRoutes from './notifications.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use(employeesRoutes);
router.use('/contracts', contractsRoutes);
router.use(schedulesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/time-off', timeoffRoutes);
router.use('/payroll', payrollRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
