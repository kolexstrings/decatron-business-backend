import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StaffFeedback } from '../models/StaffFeedback';
import { ClientReview } from '../models/ClientReview';
import { Inspection } from '../models/Inspection';
import { User } from '../models/User';
import mongoose from 'mongoose';

export class FeedbackController {
  /**
   * Staff submits feedback about a client after inspection
   * POST /api/feedback/staff
   */
  static async submitStaffFeedback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const { inspectionId, purchaseLikelihood, clientInterest, clientEngagement, followUpRequired, notes, questionsAsked, concernsRaised, budgetDiscussed, timelineDiscussed } = req.body;

      // Validate required fields
      if (!inspectionId || !purchaseLikelihood || !clientInterest || !clientEngagement) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: inspectionId, purchaseLikelihood, clientInterest, clientEngagement'
        });
        return;
      }

      // Verify inspection exists and staff is assigned
      const inspection = await Inspection.findOne({
        _id: inspectionId,
        organizationId,
        assignedStaffId: req.user!.userId,
        status: { $in: ['completed', 'no_show'] }
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found or not completed'
        });
        return;
      }

      // Check if feedback already exists
      const existingFeedback = await StaffFeedback.findOne({ inspectionId, organizationId });
      if (existingFeedback) {
        res.status(409).json({
          success: false,
          message: 'Feedback already submitted for this inspection'
        });
        return;
      }

      // Get staff name
      const staff = await User.findById(req.user!.userId);
      if (!staff) {
        res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
        return;
      }

      // Create staff feedback
      const staffFeedback = new StaffFeedback({
        organizationId,
        inspectionId,
        clientId: inspection.clientId,
        staffId: req.user!.userId,
        staffName: `${staff.profile?.firstName || ''} ${staff.profile?.lastName || ''}`.trim() || staff.username,
        purchaseLikelihood,
        clientInterest,
        clientEngagement,
        followUpRequired: followUpRequired || false,
        notes,
        questionsAsked: questionsAsked || 0,
        concernsRaised: concernsRaised || [],
        budgetDiscussed: budgetDiscussed || false,
        timelineDiscussed: timelineDiscussed || false
      });

      await staffFeedback.save();

      res.status(201).json({
        success: true,
        message: 'Staff feedback submitted successfully',
        data: staffFeedback
      });

    } catch (error) {
      console.error('Error submitting staff feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Client submits review for staff/agent after inspection
   * POST /api/feedback/client-review
   */
  static async submitClientReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const {
        inspectionId,
        overallRating,
        agentKnowledge,
        communication,
        professionalism,
        punctuality,
        reviewText,
        pros,
        cons,
        wouldRecommend,
        suggestions
      } = req.body;

      // Validate required fields
      if (!inspectionId || !overallRating || !agentKnowledge || !communication || !professionalism || !punctuality || typeof wouldRecommend !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Verify inspection exists and client is associated
      const inspection = await Inspection.findOne({
        _id: inspectionId,
        organizationId,
        $or: [
          { clientId: req.user!.userId },
          { clientEmail: req.user!.email }
        ],
        status: { $in: ['completed', 'no_show'] }
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found or not completed'
        });
        return;
      }

      // Check if review already exists
      const existingReview = await ClientReview.findOne({ inspectionId, organizationId });
      if (existingReview) {
        res.status(409).json({
          success: false,
          message: 'Review already submitted for this inspection'
        });
        return;
      }

      // Get staff name
      const staff = await User.findById(inspection.assignedStaffId);
      if (!staff) {
        res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
        return;
      }

      // Create client review
      const clientReview = new ClientReview({
        organizationId,
        inspectionId,
        clientId: inspection.clientId,
        staffId: inspection.assignedStaffId,
        staffName: inspection.assignedStaffName,
        overallRating,
        agentKnowledge,
        communication,
        professionalism,
        punctuality,
        reviewText,
        pros: pros || [],
        cons: cons || [],
        wouldRecommend,
        suggestions,
        isVerified: !!inspection.clientId, // Verified if clientId exists
        isPublic: true // Default to public
      });

      await clientReview.save();

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: clientReview
      });

    } catch (error) {
      console.error('Error submitting client review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get staff feedback for a specific inspection
   * GET /api/feedback/staff/:inspectionId
   */
  static async getStaffFeedback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const feedback = await StaffFeedback.findOne({
        inspectionId,
        organizationId
      }).populate('staffId', 'username profile.firstName profile.lastName');

      if (!feedback) {
        res.status(404).json({
          success: false,
          message: 'Staff feedback not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: feedback
      });

    } catch (error) {
      console.error('Error getting staff feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get client review for a specific inspection
   * GET /api/feedback/client-review/:inspectionId
   */
  static async getClientReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const review = await ClientReview.findOne({
        inspectionId,
        organizationId
      }).populate('staffId', 'username profile.firstName profile.lastName');

      if (!review) {
        res.status(404).json({
          success: false,
          message: 'Client review not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: review
      });

    } catch (error) {
      console.error('Error getting client review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update staff feedback (only by the same staff member)
   * PUT /api/feedback/staff/:inspectionId
   */
  static async updateStaffFeedback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const updateData = req.body;

      const feedback = await StaffFeedback.findOneAndUpdate(
        {
          inspectionId,
          organizationId,
          staffId: req.user!.userId
        },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!feedback) {
        res.status(404).json({
          success: false,
          message: 'Staff feedback not found or unauthorized'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Staff feedback updated successfully',
        data: feedback
      });

    } catch (error) {
      console.error('Error updating staff feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all reviews for a specific staff member (admin/org view)
   * GET /api/feedback/staff/:staffId/reviews
   */
  static async getStaffReviews(req: AuthRequest, res: Response): Promise<void> {
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

      const reviews = await ClientReview.find({
        staffId,
        organizationId,
        isPublic: true
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews
      });

    } catch (error) {
      console.error('Error getting staff reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
