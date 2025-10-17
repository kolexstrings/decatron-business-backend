import { Router } from 'express';
import { FeedbackController } from '../controllers/feedbackController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All feedback routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/feedback/staff:
 *   post:
 *     summary: Submit staff feedback about client purchase likelihood
 *     tags: [Feedback]
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
 *               - purchaseLikelihood
 *               - clientInterest
 *               - clientEngagement
 *             properties:
 *               inspectionId:
 *                 type: string
 *               purchaseLikelihood:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               clientInterest:
 *                 type: string
 *                 enum: [very_low, low, medium, high, very_high]
 *               clientEngagement:
 *                 type: string
 *                 enum: [poor, fair, good, excellent]
 *               followUpRequired:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               questionsAsked:
 *                 type: number
 *               concernsRaised:
 *                 type: array
 *                 items:
 *                   type: string
 *               budgetDiscussed:
 *                 type: boolean
 *               timelineDiscussed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Staff feedback submitted successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inspection not found
 *       409:
 *         description: Feedback already submitted
 */
router.post('/staff', requireRole(['staff', 'agent', 'admin']), FeedbackController.submitStaffFeedback);

/**
 * @swagger
 * /api/feedback/staff/{inspectionId}:
 *   get:
 *     summary: Get staff feedback for a specific inspection
 *     tags: [Feedback]
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
 *         description: Staff feedback retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Staff feedback not found
 */
router.get('/staff/:inspectionId', requireRole(['staff', 'agent', 'admin']), FeedbackController.getStaffFeedback);

/**
 * @swagger
 * /api/feedback/staff/{inspectionId}:
 *   put:
 *     summary: Update staff feedback for a specific inspection
 *     tags: [Feedback]
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
 *               purchaseLikelihood:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               clientInterest:
 *                 type: string
 *                 enum: [very_low, low, medium, high, very_high]
 *               clientEngagement:
 *                 type: string
 *                 enum: [poor, fair, good, excellent]
 *               followUpRequired:
 *                 type: boolean
 *               notes:
 *                 type: string
 *               questionsAsked:
 *                 type: number
 *               concernsRaised:
 *                 type: array
 *                 items:
 *                   type: string
 *               budgetDiscussed:
 *                 type: boolean
 *               timelineDiscussed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Staff feedback updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Staff feedback not found
 */
router.put('/staff/:inspectionId', requireRole(['staff', 'agent', 'admin']), FeedbackController.updateStaffFeedback);

/**
 * @swagger
 * /api/feedback/client-review:
 *   post:
 *     summary: Submit client review for staff/agent
 *     tags: [Feedback]
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
 *               - overallRating
 *               - agentKnowledge
 *               - communication
 *               - professionalism
 *               - punctuality
 *               - wouldRecommend
 *             properties:
 *               inspectionId:
 *                 type: string
 *               overallRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               agentKnowledge:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               communication:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               professionalism:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               punctuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               reviewText:
 *                 type: string
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *               wouldRecommend:
 *                 type: boolean
 *               suggestions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inspection not found
 *       409:
 *         description: Review already submitted
 */
router.post('/client-review', requireRole(['admin', 'agent', 'staff']), FeedbackController.submitClientReview);

/**
 * @swagger
 * /api/feedback/client-review/{inspectionId}:
 *   get:
 *     summary: Get client review for a specific inspection
 *     tags: [Feedback]
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
 *         description: Client review retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client review not found
 */
router.get('/client-review/:inspectionId', requireRole(['admin', 'agent', 'staff']), FeedbackController.getClientReview);

/**
 * @swagger
 * /api/feedback/staff/{staffId}/reviews:
 *   get:
 *     summary: Get all reviews for a specific staff member
 *     tags: [Feedback]
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
 *         description: Staff reviews retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/staff/:staffId/reviews', requireRole(['admin']), FeedbackController.getStaffReviews);

export default router;
