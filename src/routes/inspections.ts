import { Router } from 'express';
import { InspectionController } from '../controllers/inspectionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All inspection routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/inspections/{inspectionId}:
 *   get:
 *     summary: Get inspection details
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inspectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inspection details retrieved successfully
 *       404:
 *         description: Inspection not found
 *       403:
 *         description: Access denied
 */

/**
 * @swagger
 * /api/inspections/staff/pending:
 *   get:
 *     summary: Get pending inspections for staff member
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending inspections retrieved successfully
 */

/**
 * @swagger
 * /api/inspections/{inspectionId}/accept:
 *   put:
 *     summary: Staff accepts assigned inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inspectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inspection accepted successfully
 *       404:
 *         description: Inspection not found or already responded to
 */

/**
 * @swagger
 * /api/inspections/{inspectionId}/reject:
 *   put:
 *     summary: Staff rejects assigned inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inspectionId
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspection rejected successfully
 *       404:
 *         description: Inspection not found or already responded to
 */

/**
 * @swagger
 * /api/inspections/{inspectionId}/reassign:
 *   put:
 *     summary: Admin manually reassigns inspection to specific staff
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inspectionId
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
 *               - newStaffId
 *             properties:
 *               newStaffId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspection reassigned successfully
 *       400:
 *         description: Staff not available or not found
 *       404:
 *         description: Inspection not found
 */

/**
 * @swagger
 * /api/inspections/{inspectionId}/auto-reassign:
 *   put:
 *     summary: Admin automatically reassigns inspection using intelligent system
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inspectionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inspection automatically reassigned successfully
 *       400:
 *         description: No available staff found
 *       404:
 *         description: Inspection not found
 */

// Staff actions on their own inspections
router.get('/:inspectionId', InspectionController.getInspection);
router.get('/staff/pending', InspectionController.getPendingInspections);
router.put('/:inspectionId/accept', InspectionController.acceptInspection);
router.put('/:inspectionId/reject', InspectionController.rejectInspection);

// Admin reassignment actions
router.put('/:inspectionId/reassign', InspectionController.reassignInspection);
router.put('/:inspectionId/auto-reassign', InspectionController.autoReassignInspection);

export default router;
