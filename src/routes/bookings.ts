import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All booking routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
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
 *               source:
 *                 type: string
 *                 enum: [web, whatsapp, walk_in, proxy]
 *               priority:
 *                 type: string
 *                 enum: [normal, urgent, vip]
 *               duration:
 *                 type: number
 *                 minimum: 15
 *                 maximum: 480
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', BookingController.createBooking);

/**
 * @swagger
 * /api/bookings/check-availability:
 *   post:
 *     summary: Check availability for a time slot
 *     tags: [Bookings]
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
 *                 minimum: 15
 *                 maximum: 480
 *     responses:
 *       200:
 *         description: Availability check completed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/check-availability', BookingController.checkAvailability);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:bookingId', BookingController.getBooking);

/**
 * @swagger
 * /api/bookings/client/{email}:
 *   get:
 *     summary: Get bookings by client email
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/client/:email', BookingController.getBookingsByClient);

/**
 * @swagger
 * /api/bookings/property/{propertyId}:
 *   get:
 *     summary: Get bookings by property
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/property/:propertyId', BookingController.getBookingsByProperty);

/**
 * @swagger
 * /api/bookings/staff/{staffId}:
 *   get:
 *     summary: Get bookings by staff member
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/staff/:staffId', BookingController.getBookingsByStaff);

/**
 * @swagger
 * /api/bookings/{bookingId}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:bookingId/cancel', BookingController.cancelBooking);

/**
 * @swagger
 * /api/bookings/{bookingId}/reschedule:
 *   put:
 *     summary: Reschedule a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 *               - requestedDate
 *               - preferredTimeSlot
 *             properties:
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
 *               duration:
 *                 type: number
 *                 minimum: 15
 *                 maximum: 480
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:bookingId/reschedule', BookingController.rescheduleBooking);

/**
 * @swagger
 * /api/bookings/upcoming:
 *   get:
 *     summary: Get upcoming bookings for organization
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *     responses:
 *       200:
 *         description: Upcoming bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/upcoming', BookingController.getUpcomingBookings);

/**
 * @swagger
 * /api/bookings/stats:
 *   get:
 *     summary: Get booking statistics
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Booking statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', BookingController.getBookingStats);

/**
 * @swagger
 * /api/bookings/availability/{propertyId}/{date}:
 *   get:
 *     summary: Get available time slots for a property and date
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
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
 *         description: Available time slots retrieved successfully
 *       404:
 *         description: Property not found
 *       401:
 *         description: Unauthorized
 */
router.get('/availability/:propertyId/:date', BookingController.getAvailableTimeSlots);

export default router;
