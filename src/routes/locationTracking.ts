import { Router } from 'express';
import { LocationTrackingController } from '../controllers/locationTrackingController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All location tracking routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/location/track:
 *   post:
 *     summary: Update real-time location during inspection
 *     tags: [Location Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspectionId
 *               - latitude
 *               - longitude
 *             properties:
 *               inspectionId:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               accuracy:
 *                 type: number
 *                 minimum: 0
 *               altitude:
 *                 type: number
 *               speed:
 *                 type: number
 *                 minimum: 0
 *               heading:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 360
 *               status:
 *                 type: string
 *                 enum: [traveling_to_property, at_property, traveling_to_office, inspection_in_progress, completed]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inspection not found or user not authorized
 */
router.post('/track', LocationTrackingController.updateLocation);

/**
 * @swagger
 * /api/location/inspection/{inspectionId}:
 *   get:
 *     summary: Get location history for an inspection
 *     tags: [Location Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inspectionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [staff, client]
 *     responses:
 *       200:
 *         description: Location history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inspection not found
 */
router.get('/inspection/:inspectionId', LocationTrackingController.getInspectionLocationHistory);

/**
 * @swagger
 * /api/location/inspection/{inspectionId}/current:
 *   get:
 *     summary: Get current locations of all parties in an inspection
 *     tags: [Location Tracking]
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
 *         description: Current locations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inspection not found
 */
router.get('/inspection/:inspectionId/current', LocationTrackingController.getCurrentLocations);

/**
 * @swagger
 * /api/location/map/{inspectionId}:
 *   get:
 *     summary: Get all location data for map visualization
 *     tags: [Location Tracking]
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
 *         description: Map data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inspection not found
 */
router.get('/map/:inspectionId', LocationTrackingController.getMapData);

/**
 * @swagger
 * /api/location/distance:
 *   post:
 *     summary: Calculate distance and ETA between two points
 *     tags: [Location Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromLat
 *               - fromLng
 *               - toLat
 *               - toLng
 *             properties:
 *               fromLat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               fromLng:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               toLat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               toLng:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               mode:
 *                 type: string
 *                 enum: [driving, walking, transit]
 *                 default: driving
 *     responses:
 *       200:
 *         description: Distance and time calculated successfully
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 */
router.post('/distance', LocationTrackingController.calculateDistance);

export default router;
