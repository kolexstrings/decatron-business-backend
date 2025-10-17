import { Router } from 'express';
import { StaffScheduleController } from '../controllers/staffScheduleController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All staff schedule routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/staff-schedules:
 *   post:
 *     summary: Create staff schedule
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - weeklySchedule
 *             properties:
 *               staffId:
 *                 type: string
 *               weeklySchedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     isWorking:
 *                       type: boolean
 *                     startTime:
 *                       type: string
 *                       pattern: '^\d{2}:\d{2}$'
 *                     endTime:
 *                       type: string
 *                       pattern: '^\d{2}:\d{2}$'
 *                     breakStart:
 *                       type: string
 *                       pattern: '^\d{2}:\d{2}$'
 *                     breakEnd:
 *                       type: string
 *                       pattern: '^\d{2}:\d{2}$'
 *                     maxInspections:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 20
 *               isActive:
 *                 type: boolean
 *               maxConcurrentInspections:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               preferredInspectionDuration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 240
 *               maxTravelTime:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *               workArea:
 *                 type: object
 *                 properties:
 *                   center:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                   radius:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 200
 *     responses:
 *       201:
 *         description: Staff schedule created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Schedule already exists
 */
router.post('/', StaffScheduleController.createStaffSchedule);

/**
 * @swagger
 * /api/staff-schedules/{scheduleId}:
 *   get:
 *     summary: Get staff schedule by ID
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff schedule retrieved successfully
 *       404:
 *         description: Staff schedule not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:scheduleId', StaffScheduleController.getStaffSchedule);

/**
 * @swagger
 * /api/staff-schedules/staff/{staffId}:
 *   get:
 *     summary: Get staff schedule by staff ID
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff schedule retrieved successfully
 *       404:
 *         description: Staff schedule not found
 *       401:
 *         description: Unauthorized
 */
router.get('/staff/:staffId', StaffScheduleController.getStaffScheduleByStaffId);

/**
 * @swagger
 * /api/staff-schedules/{scheduleId}:
 *   put:
 *     summary: Update staff schedule
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weeklySchedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     isWorking:
 *                       type: boolean
 *                     startTime:
 *                       type: string
 *                       pattern: '^\d{2}:\d{2}$'
 *                     endTime:
 *                       type: string
 *                       pattern: '^\d{2}:\d{2}$'
 *               isActive:
 *                 type: boolean
 *               maxConcurrentInspections:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               preferredInspectionDuration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 240
 *               maxTravelTime:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *               workArea:
 *                 type: object
 *                 properties:
 *                   center:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                   radius:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 200
 *     responses:
 *       200:
 *         description: Staff schedule updated successfully
 *       404:
 *         description: Staff schedule not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:scheduleId', StaffScheduleController.updateStaffSchedule);

/**
 * @swagger
 * /api/staff-schedules:
 *   get:
 *     summary: Get all active staff schedules for organization
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff schedules retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', StaffScheduleController.getAllStaffSchedules);

/**
 * @swagger
 * /api/staff-schedules/staff/{staffId}/date/{date}:
 *   get:
 *     summary: Get staff schedule for a specific date
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Staff schedule for date retrieved successfully
 *       404:
 *         description: Staff schedule not found
 *       401:
 *         description: Unauthorized
 */
router.get('/staff/:staffId/date/:date', StaffScheduleController.getStaffScheduleForDate);

/**
 * @swagger
 * /api/staff-schedules/{scheduleId}/metrics:
 *   put:
 *     summary: Update staff performance metrics
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspectionStatus
 *             properties:
 *               inspectionStatus:
 *                 type: string
 *                 enum: [completed, cancelled]
 *     responses:
 *       200:
 *         description: Performance metrics updated successfully
 *       404:
 *         description: Staff schedule not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:scheduleId/metrics', StaffScheduleController.updatePerformanceMetrics);

/**
 * @swagger
 * /api/staff-schedules/{scheduleId}/toggle-active:
 *   put:
 *     summary: Toggle staff active status
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff active status toggled successfully
 *       404:
 *         description: Staff schedule not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:scheduleId/toggle-active', StaffScheduleController.toggleStaffActiveStatus);

/**
 * @swagger
 * /api/staff-schedules/{scheduleId}:
 *   delete:
 *     summary: Delete staff schedule
 *     tags: [Staff Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff schedule deleted successfully
 *       404:
 *         description: Staff schedule not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:scheduleId', StaffScheduleController.deleteStaffSchedule);

export default router;
