import { Router } from 'express';
import { ProxyBookingController } from '../controllers/proxyBookingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All proxy booking routes require authentication and staff/admin role
router.use(authenticateToken);

/**
 * @swagger
 * /api/proxy-bookings:
 *   post:
 *     summary: Staff/Admin creates a booking on behalf of a client
 *     tags: [Proxy Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - clientName
 *               - clientEmail
 *               - clientPhone
 *               - requestedDate
 *               - preferredTimeSlot
 *               - clientType
 *             properties:
 *               propertyId:
 *                 type: string
 *               clientName:
 *                 type: string
 *               clientEmail:
 *                 type: string
 *               clientPhone:
 *                 type: string
 *               requestedDate:
 *                 type: string
 *                 format: date
 *               preferredTimeSlot:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                     pattern: '^\d{2}:\d{2}$'
 *                   endTime:
 *                     type: string
 *                     pattern: '^\d{2}:\d{2}$'
 *               clientId:
 *                 type: string
 *                 description: Optional for existing clients
 *               clientType:
 *                 type: string
 *                 enum: [walk_in, phone, existing_client]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               duration:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Missing required fields or validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/proxy-bookings/check-availability:
 *   post:
 *     summary: Check availability for proxy booking
 *     tags: [Proxy Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - requestedDate
 *               - startTime
 *             properties:
 *               propertyId:
 *                 type: string
 *               requestedDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 pattern: '^\d{2}:\d{2}$'
 *               duration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Availability check completed
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Property not found
 */

router.post('/', ProxyBookingController.createProxyBooking);
router.post('/check-availability', ProxyBookingController.checkAvailability);

export default router;
