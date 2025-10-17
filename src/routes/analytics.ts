import { Router, Request, Response } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// All analytics routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/analytics/organization/dashboard:
 *   get:
 *     summary: Get comprehensive organization analytics dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/organization/dashboard', requireRole(['admin']), AnalyticsController.getOrganizationDashboard);

/**
 * @swagger
 * /api/analytics/staff/dashboard:
 *   get:
 *     summary: Get staff/agent scoped analytics dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/staff/dashboard', requireRole(['staff', 'agent']), AnalyticsController.getStaffDashboard);

/**
 * @swagger
 * /api/analytics/organization/period:
 *   get:
 *     summary: Get detailed analytics for a specific time period
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Organization analytics by period retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/organization/period', requireRole(['admin']), AnalyticsController.getOrganizationAnalyticsByPeriod);

/**
 * @swagger
 * /api/analytics/organization/insights:
 *   get:
 *     summary: Get intelligent business insights for organization
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business insights retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/organization/insights', requireRole(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Organization ID not found in token'
      });
      return;
    }

    const insights = await AnalyticsController.generateBusinessInsights(organizationId);

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error getting business insights:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/analytics/staff/{staffId}/performance:
 *   get:
 *     summary: Get performance insights for a specific staff member
 *     tags: [Analytics]
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
 *         description: Staff performance insights retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/staff/:staffId/performance', requireRole(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { staffId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Organization ID not found in token'
      });
      return;
    }

    const insights = await AnalyticsController.getStaffPerformanceInsights(staffId, organizationId);

    res.status(200).json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error getting staff performance insights:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/analytics/organization/staff-performance:
 *   get:
 *     summary: Get comprehensive staff performance ranking
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff performance ranking retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/organization/staff-performance', requireRole(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Organization ID not found in token'
      });
      return;
    }

    const topPerformers = await AnalyticsController.getTopPerformingStaff(organizationId);

    res.status(200).json({
      success: true,
      data: topPerformers
    });

  } catch (error) {
    console.error('Error getting staff performance ranking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
