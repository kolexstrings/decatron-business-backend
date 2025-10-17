import { Router } from 'express';
import { AvailabilityController } from '../controllers/availabilityController';
import { authenticateToken, requireRole } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Availability:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *         monday:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             timeSlots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *         tuesday:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             timeSlots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *         wednesday:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             timeSlots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *         thursday:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             timeSlots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *         friday:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             timeSlots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *         saturday:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             timeSlots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *         sunday:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             timeSlots:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *         timeSlotDuration:
 *           type: number
 *         bufferTime:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TimeSlot:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 */

const router = Router();

/**
 * @swagger
 * /availability:
 *   post:
 *     summary: Create a new availability schedule
 *     tags: [Availability]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               monday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                           example: "09:00"
 *                         endTime:
 *                           type: string
 *                           example: "17:00"
 *               tuesday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               wednesday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               thursday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               friday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               saturday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               sunday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               timeSlotDuration:
 *                 type: number
 *                 description: Duration of each time slot in minutes
 *               bufferTime:
 *                 type: number
 *                 description: Buffer time between slots in minutes
 *     responses:
 *       201:
 *         description: Availability schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 availability:
 *                   $ref: '#/components/schemas/Availability'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, requireRole(['organization']), AvailabilityController.createAvailability);

/**
 * @swagger
 * /availability:
 *   get:
 *     summary: Get all availability schedules for organization
 *     tags: [Availability]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of availability schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availabilities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Availability'
 *       403:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, requireRole(['organization']), AvailabilityController.getOrganizationAvailabilities);

/**
 * @swagger
 * /availability/{availabilityId}:
 *   get:
 *     summary: Get a specific availability schedule
 *     tags: [Availability]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability schedule details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availability:
 *                   $ref: '#/components/schemas/Availability'
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Availability not found
 */
router.get('/:availabilityId', authenticateToken, requireRole(['organization']), AvailabilityController.getAvailability);

/**
 * @swagger
 * /availability/{availabilityId}:
 *   put:
 *     summary: Update an availability schedule
 *     tags: [Availability]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: availabilityId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               monday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               tuesday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               wednesday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               thursday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               friday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               saturday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               sunday:
 *                 type: object
 *                 properties:
 *                   isAvailable:
 *                     type: boolean
 *                   timeSlots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *               timeSlotDuration:
 *                 type: number
 *               bufferTime:
 *                 type: number
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 availability:
 *                   $ref: '#/components/schemas/Availability'
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Availability not found
 */
router.put('/:availabilityId', authenticateToken, requireRole(['organization']), AvailabilityController.updateAvailability);

/**
 * @swagger
 * /availability/{availabilityId}:
 *   delete:
 *     summary: Delete an availability schedule
 *     tags: [Availability]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Availability not found
 */
router.delete('/:availabilityId', authenticateToken, requireRole(['organization']), AvailabilityController.deleteAvailability);

/**
 * @swagger
 * /availability/{availabilityId}/time-slots:
 *   get:
 *     summary: Get available time slots for a specific date
 *     tags: [Availability]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: availabilityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Available time slots for the date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                 availabilityId:
 *                   type: string
 *                 timeSlots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimeSlot'
 *       400:
 *         description: Invalid date format
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Availability not found
 */
router.get('/:availabilityId/time-slots', authenticateToken, requireRole(['organization']), AvailabilityController.getAvailableTimeSlots);

export default router;
