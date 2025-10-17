import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Inspection } from '../models/Inspection';
import { StaffFeedback } from '../models/StaffFeedback';
import { ClientReview } from '../models/ClientReview';
import { User } from '../models/User';
import { Booking } from '../models/Booking';

export class AnalyticsController {
  /**
   * Get comprehensive organization analytics dashboard
   * GET /api/analytics/organization/dashboard
   */
  static async getOrganizationDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Current month data
      const currentMonthInspections = await Inspection.find({
        organizationId,
        scheduledDate: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const currentMonthBookings = await Booking.find({
        organizationId,
        requestedDate: { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Last month data for comparison
      const lastMonthInspections = await Inspection.find({
        organizationId,
        scheduledDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      });

      const lastMonthBookings = await Booking.find({
        organizationId,
        requestedDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      });

      // Staff and agent counts
      const staffCount = await User.countDocuments({
        organizationId,
        role: { $in: ['staff', 'agent'] }
      });

      const agentCount = await User.countDocuments({
        organizationId,
        role: 'agent'
      });

      // Inspection status breakdown
      const inspectionStatusStats = await Inspection.aggregate([
        { $match: { organizationId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Upcoming inspections (next 7 days)
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingInspections = await Inspection.countDocuments({
        organizationId,
        scheduledDate: { $gte: now, $lte: nextWeek },
        status: { $in: ['assigned', 'scheduled', 'in_progress'] }
      });

      // Ongoing inspections (real-time)
      const ongoingInspections = await Inspection.countDocuments({
        organizationId,
        status: 'in_progress',
        scheduledDate: { $lte: now }
      });

      // Purchase likelihood insights
      const purchaseLikelihoodStats = await StaffFeedback.aggregate([
        { $match: { organizationId } },
        {
          $group: {
            _id: '$purchaseLikelihood',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Client review stats
      const reviewStats = await ClientReview.aggregate([
        { $match: { organizationId, isPublic: true } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$overallRating' },
            totalReviews: { $sum: 1 },
            recommendationRate: { $avg: { $cond: ['$wouldRecommend', 1, 0] } }
          }
        }
      ]);

      // Calculate trends
      const inspectionGrowth = lastMonthInspections.length > 0
        ? ((currentMonthInspections.length - lastMonthInspections.length) / lastMonthInspections.length) * 100
        : 0;

      const bookingGrowth = lastMonthBookings.length > 0
        ? ((currentMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100
        : 0;

      const dashboardData = {
        overview: {
          totalInspections: currentMonthInspections.length,
          totalBookings: currentMonthBookings.length,
          staffCount,
          agentCount,
          upcomingInspections,
          ongoingInspections
        },
        trends: {
          inspectionGrowth: Math.round(inspectionGrowth * 100) / 100,
          bookingGrowth: Math.round(bookingGrowth * 100) / 100,
          trendDirection: inspectionGrowth > 0 ? 'up' : inspectionGrowth < 0 ? 'down' : 'stable'
        },
        inspectionStatus: inspectionStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        purchaseLikelihood: purchaseLikelihoodStats,
        clientReviews: reviewStats[0] || {
          averageRating: 0,
          totalReviews: 0,
          recommendationRate: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        },
        topPerformers: await AnalyticsController.getTopPerformingStaff(organizationId),
        insights: await AnalyticsController.generateBusinessInsights(organizationId)
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error getting organization dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get staff/agent scoped analytics dashboard
   * GET /api/analytics/staff/dashboard
   */
  static async getStaffDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const staffId = req.user!.userId;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Staff's inspections this month
      const staffInspections = await Inspection.find({
        assignedStaffId: staffId,
        organizationId,
        scheduledDate: { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Staff's feedback submitted
      const staffFeedback = await StaffFeedback.find({
        staffId,
        organizationId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Reviews about this staff
      const staffReviews = await ClientReview.find({
        staffId,
        organizationId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Calculate performance metrics
      const completedInspections = staffInspections.filter(i => i.status === 'completed').length;
      const totalInspections = staffInspections.length;
      const completionRate = totalInspections > 0 ? (completedInspections / totalInspections) * 100 : 0;

      const averageRating = staffReviews.length > 0
        ? staffReviews.reduce((sum, review) => sum + review.overallRating, 0) / staffReviews.length
        : 0;

      const recommendationRate = staffReviews.length > 0
        ? (staffReviews.filter(r => r.wouldRecommend).length / staffReviews.length) * 100
        : 0;

      // Purchase likelihood trend for this staff
      const avgPurchaseLikelihood = staffFeedback.length > 0
        ? staffFeedback.reduce((sum, feedback) => sum + feedback.purchaseLikelihood, 0) / staffFeedback.length
        : 0;

      const dashboardData = {
        overview: {
          totalInspections: staffInspections.length,
          completedInspections,
          completionRate: Math.round(completionRate * 100) / 100,
          totalFeedback: staffFeedback.length,
          totalReviews: staffReviews.length,
          averageRating: Math.round(averageRating * 100) / 100,
          recommendationRate: Math.round(recommendationRate * 100) / 100
        },
        purchaseLikelihood: {
          average: Math.round(avgPurchaseLikelihood * 100) / 100,
          trend: avgPurchaseLikelihood > 3 ? 'high' : avgPurchaseLikelihood > 2 ? 'medium' : 'low'
        },
        recentActivity: {
          inspections: staffInspections.slice(0, 5).map(inspection => ({
            id: inspection._id,
            propertyTitle: inspection.propertyTitle,
            scheduledDate: inspection.scheduledDate,
            status: inspection.status,
            clientName: inspection.clientName
          })),
          feedback: staffFeedback.slice(0, 5).map(feedback => ({
            id: feedback._id,
            inspectionId: feedback.inspectionId,
            purchaseLikelihood: feedback.purchaseLikelihood,
            clientInterest: feedback.clientInterest,
            createdAt: feedback.createdAt
          }))
        },
        performanceInsights: await AnalyticsController.getStaffPerformanceInsights(staffId, organizationId)
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error getting staff dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get top performing staff based on reviews and completion rates
   */
  static async getTopPerformingStaff(organizationId: string) {
    const staffPerformance = await Inspection.aggregate([
      {
        $match: {
          organizationId,
          status: 'completed',
          scheduledDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: '$assignedStaffId',
          completedInspections: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          totalInspections: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'clientreviews',
          localField: '_id',
          foreignField: 'staffId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          avgRating: { $avg: '$reviews.overallRating' },
          reviewCount: { $size: '$reviews' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staffInfo'
        }
      },
      {
        $unwind: '$staffInfo'
      },
      {
        $project: {
          staffId: '$_id',
          staffName: { $concat: ['$staffInfo.profile.firstName', ' ', '$staffInfo.profile.lastName'] },
          completedInspections: 1,
          avgRating: { $round: ['$avgRating', 2] },
          reviewCount: 1,
          performanceScore: {
            $add: [
              { $multiply: [{ $divide: ['$completedInspections', { $max: ['$totalInspections', 1] }] }, 40] },
              { $multiply: [{ $ifNull: ['$avgRating', 0] }, 60] }
            ]
          }
        }
      },
      { $sort: { performanceScore: -1 } },
      { $limit: 10 }
    ]);

    return staffPerformance;
  }

  /**
   * Generate intelligent business insights
   */
  static async generateBusinessInsights(organizationId: string) {
    const insights = [];

    // Insight 1: Purchase likelihood trend
    const purchaseStats = await StaffFeedback.aggregate([
      { $match: { organizationId } },
      {
        $group: {
          _id: '$purchaseLikelihood',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    if (purchaseStats.length > 0) {
      const highLikelihoodCount = purchaseStats
        .filter((s: any) => s._id >= 4)
        .reduce((sum: number, s: any) => sum + s.count, 0);
      const totalFeedback = purchaseStats.reduce((sum: number, s: any) => sum + s.count, 0);
      const highLikelihoodRate = (highLikelihoodCount / totalFeedback) * 100;

      if (highLikelihoodRate > 70) {
        insights.push({
          type: 'positive',
          title: 'Strong Purchase Interest',
          message: `${Math.round(highLikelihoodRate)}% of clients show high purchase likelihood. Consider increasing inventory or marketing efforts.`,
          metric: 'purchaseLikelihood',
          value: highLikelihoodRate,
          trend: 'up'
        });
      }
    }

    // Insight 2: Review trends
    const reviewStats = await ClientReview.aggregate([
      { $match: { organizationId, isPublic: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$overallRating' },
          totalReviews: { $sum: 1 },
          recommendationRate: { $avg: { $cond: ['$wouldRecommend', 1, 0] } }
        }
      }
    ]);

    if (reviewStats.length > 0 && reviewStats[0].totalReviews > 5) {
      const avgRating = reviewStats[0].averageRating;
      if (avgRating >= 4.5) {
        insights.push({
          type: 'positive',
          title: 'Excellent Service Quality',
          message: `Average rating of ${avgRating.toFixed(1)} stars indicates high client satisfaction. Your service quality is a competitive advantage.`,
          metric: 'averageRating',
          value: avgRating,
          trend: 'up'
        });
      } else if (avgRating < 3) {
        insights.push({
          type: 'warning',
          title: 'Service Quality Needs Attention',
          message: `Average rating of ${avgRating.toFixed(1)} stars suggests clients are not fully satisfied. Review staff training and service processes.`,
          metric: 'averageRating',
          value: avgRating,
          trend: 'down'
        });
      }
    }

    // Insight 3: Staff utilization
    const staffUtilization = await Inspection.aggregate([
      {
        $match: {
          organizationId,
          scheduledDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$assignedStaffId',
          inspectionsCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          avgInspectionsPerStaff: { $avg: '$inspectionsCount' },
          maxInspectionsPerStaff: { $max: '$inspectionsCount' },
          minInspectionsPerStaff: { $min: '$inspectionsCount' }
        }
      }
    ]);

    if (staffUtilization.length > 0) {
      const utilization = staffUtilization[0];
      if (utilization.maxInspectionsPerStaff - utilization.minInspectionsPerStaff > 3) {
        insights.push({
          type: 'warning',
          title: 'Uneven Staff Workload',
          message: `Staff workload varies significantly (min: ${utilization.minInspectionsPerStaff}, max: ${utilization.maxInspectionsPerStaff}). Consider workload balancing.`,
          metric: 'staffUtilization',
          value: utilization.maxInspectionsPerStaff - utilization.minInspectionsPerStaff,
          trend: 'neutral'
        });
      }
    }

    return insights;
  }

  /**
   * Get staff performance insights
   */
  static async getStaffPerformanceInsights(staffId: string, organizationId: string) {
    const insights = [];

    // Get staff's average ratings vs organization average
    const staffReviews = await ClientReview.find({ staffId, organizationId });
    const orgReviews = await ClientReview.find({ organizationId });

    if (staffReviews.length > 0 && orgReviews.length > 0) {
      const staffAvgRating = staffReviews.reduce((sum, r) => sum + r.overallRating, 0) / staffReviews.length;
      const orgAvgRating = orgReviews.reduce((sum, r) => sum + r.overallRating, 0) / orgReviews.length;

      if (staffAvgRating > orgAvgRating + 0.5) {
        insights.push({
          type: 'positive',
          message: `Your ratings (${staffAvgRating.toFixed(1)}) are significantly above organization average (${orgAvgRating.toFixed(1)})`
        });
      }
    }

    // Get purchase likelihood trend
    const staffFeedback = await StaffFeedback.find({ staffId, organizationId }).sort({ createdAt: -1 }).limit(10);
    if (staffFeedback.length >= 5) {
      const recentAvg = staffFeedback.slice(0, 5).reduce((sum, f) => sum + f.purchaseLikelihood, 0) / 5;
      const olderAvg = staffFeedback.slice(5).reduce((sum, f) => sum + f.purchaseLikelihood, 0) / Math.min(5, staffFeedback.length - 5);

      if (recentAvg > olderAvg + 0.5) {
        insights.push({
          type: 'positive',
          message: `Your recent client purchase likelihood assessments (${recentAvg.toFixed(1)}) show improvement over previous period (${olderAvg.toFixed(1)})`
        });
      }
    }

    return insights;
  }

  /**
   * Get detailed analytics for a specific time period
   * GET /api/analytics/organization/period?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getOrganizationAnalyticsByPeriod(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Inspections by day
      const inspectionsByDay = await Inspection.aggregate([
        {
          $match: {
            organizationId,
            scheduledDate: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' }
            },
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Staff performance ranking
      const staffPerformance = await Inspection.aggregate([
        {
          $match: {
            organizationId,
            scheduledDate: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$assignedStaffId',
            completedInspections: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'clientreviews',
            localField: '_id',
            foreignField: 'staffId',
            as: 'reviews'
          }
        },
        {
          $addFields: {
            avgRating: { $avg: '$reviews.overallRating' },
            reviewCount: { $size: '$reviews' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'staffInfo'
          }
        },
        {
          $unwind: '$staffInfo'
        },
        {
          $project: {
            staffName: { $concat: ['$staffInfo.profile.firstName', ' ', '$staffInfo.profile.lastName'] },
            completedInspections: 1,
            avgRating: 1,
            reviewCount: 1
          }
        },
        { $sort: { completedInspections: -1 } }
      ]);

      const analyticsData = {
        period: { start: start.toISOString(), end: end.toISOString() },
        inspectionsByDay,
        staffPerformance,
        summary: {
          totalInspections: inspectionsByDay.reduce((sum, day) => sum + day.count, 0),
          totalCompleted: inspectionsByDay.reduce((sum, day) => sum + day.completed, 0),
          totalCancelled: inspectionsByDay.reduce((sum, day) => sum + day.cancelled, 0),
          completionRate: inspectionsByDay.length > 0 ?
            (inspectionsByDay.reduce((sum, day) => sum + day.completed, 0) / inspectionsByDay.reduce((sum, day) => sum + day.count, 0)) * 100 : 0
        }
      };

      res.status(200).json({
        success: true,
        data: analyticsData
      });

    } catch (error) {
      console.error('Error getting organization analytics by period:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
