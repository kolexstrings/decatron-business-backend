import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Inspection, IInspection } from '../models/Inspection';
import { User } from '../models/User';
import { StaffSchedule } from '../models/StaffSchedule';
import { IntelligentStaffAssignmentService } from '../services/intelligentStaffAssignmentService';
import mongoose from 'mongoose';

export class InspectionController {
  /**
   * Staff accepts an assigned inspection
   * PUT /api/inspections/:inspectionId/accept
   */
  static async acceptInspection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const staffId = req.user?.userId;

      if (!staffId) {
        res.status(401).json({
          success: false,
          message: 'Staff ID not found in token'
        });
        return;
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        assignedStaffId: staffId,
        assignmentStatus: 'pending'
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found or already responded to'
        });
        return;
      }

      // Update inspection status
      inspection.assignmentStatus = 'accepted';
      inspection.assignmentResponseAt = new Date();
      inspection.assignmentResponseBy = new mongoose.Types.ObjectId(staffId);
      inspection.status = 'scheduled'; // Ready to be conducted

      await inspection.save();

      res.status(200).json({
        success: true,
        message: 'Inspection accepted successfully',
        data: inspection
      });

    } catch (error) {
      console.error('Error accepting inspection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Staff rejects an assigned inspection
   * PUT /api/inspections/:inspectionId/reject
   */
  static async rejectInspection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const { reason } = req.body;
      const staffId = req.user?.userId;

      if (!staffId) {
        res.status(401).json({
          success: false,
          message: 'Staff ID not found in token'
        });
        return;
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        assignedStaffId: staffId,
        assignmentStatus: 'pending'
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found or already responded to'
        });
        return;
      }

      // Update inspection status
      inspection.assignmentStatus = 'rejected';
      inspection.assignmentResponseAt = new Date();
      inspection.assignmentResponseBy = new mongoose.Types.ObjectId(staffId);
      inspection.rejectionReason = reason;
      inspection.status = 'assigned'; // Back to assigned for reassignment

      await inspection.save();

      // TODO: Trigger automatic reassignment to next best staff
      // This could be done via a background job or immediate call

      res.status(200).json({
        success: true,
        message: 'Inspection rejected. Will be reassigned to another staff member.',
        data: inspection
      });

    } catch (error) {
      console.error('Error rejecting inspection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Admin manually reassigns inspection to specific staff
   * PUT /api/inspections/:inspectionId/reassign
   */
  static async reassignInspection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const { newStaffId, reason } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Admin ID not found in token'
        });
        return;
      }

      const inspection = await Inspection.findById(inspectionId);
      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
        return;
      }

      // Verify new staff exists and is active
      const newStaff = await User.findById(newStaffId);
      if (!newStaff) {
        res.status(404).json({
          success: false,
          message: 'New staff member not found'
        });
        return;
      }

      const staffSchedule = await StaffSchedule.findOne({
        staffId: newStaffId,
        organizationId: inspection.organizationId,
        isActive: true
      });

      if (!staffSchedule) {
        res.status(400).json({
          success: false,
          message: 'New staff member is not active or not found in this organization'
        });
        return;
      }

      // Check if new staff is available for this time slot
      const isAvailable = await IntelligentStaffAssignmentService.checkStaffAvailability(
        staffSchedule,
        inspection.scheduledDate,
        inspection.startTime,
        inspection.endTime,
        inspection.duration
      );

      if (!isAvailable.isAvailable) {
        res.status(400).json({
          success: false,
          message: `Staff member is not available for this time slot. ${isAvailable.concurrentSlots >= staffSchedule.maxConcurrentInspections ? 'Maximum concurrent inspections reached.' : 'Schedule conflict detected.'}`
        });
        return;
      }

      // Update inspection with new staff assignment
      const oldStaffId = inspection.assignedStaffId;
      const oldStaffName = inspection.assignedStaffName;

      inspection.assignedStaffId = new mongoose.Types.ObjectId(newStaffId);
      inspection.assignedStaffName = `${newStaff.profile?.firstName || ''} ${newStaff.profile?.lastName || ''}`.trim() || newStaff.username;
      inspection.assignmentStatus = 'pending'; // New staff needs to accept
      inspection.assignmentResponseAt = undefined;
      inspection.assignmentResponseBy = undefined;
      inspection.rejectionReason = undefined;
      inspection.status = 'assigned';

      // Add notes about reassignment
      const reassignmentNote = `Reassigned from ${oldStaffName} to ${inspection.assignedStaffName}${reason ? ` - ${reason}` : ''}`;
      inspection.notes = inspection.notes ? `${inspection.notes}\n${reassignmentNote}` : reassignmentNote;

      await inspection.save();

      res.status(200).json({
        success: true,
        message: 'Inspection reassigned successfully',
        data: {
          inspection,
          reassignmentDetails: {
            from: { id: oldStaffId, name: oldStaffName },
            to: { id: newStaffId, name: inspection.assignedStaffName },
            reason: reason || 'Manual reassignment'
          }
        }
      });

    } catch (error) {
      console.error('Error reassigning inspection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Admin automatically reassigns inspection using intelligent system
   * PUT /api/inspections/:inspectionId/auto-reassign
   */
  static async autoReassignInspection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Admin ID not found in token'
        });
        return;
      }

      const inspection = await Inspection.findById(inspectionId).populate('propertyId');
      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
        return;
      }

      // Get property details for intelligent assignment
      const property = inspection.propertyId as any;
      if (!property) {
        res.status(404).json({
          success: false,
          message: 'Property details not found'
        });
        return;
      }

      // Find best available staff using intelligent assignment
      const bestStaff = await IntelligentStaffAssignmentService.findBestStaffForInspection(
        inspection.organizationId,
        property,
        inspection.scheduledDate,
        inspection.startTime,
        inspection.endTime,
        inspection.duration,
        inspection.assignedStaffId // Exclude current staff
      );

      if (!bestStaff) {
        res.status(400).json({
          success: false,
          message: 'No available staff found for reassignment'
        });
        return;
      }

      // Update inspection with new staff assignment
      const oldStaffId = inspection.assignedStaffId;
      const oldStaffName = inspection.assignedStaffName;

      inspection.assignedStaffId = bestStaff.staffId;
      inspection.assignedStaffName = bestStaff.staffName;
      inspection.assignmentStatus = 'pending'; // New staff needs to accept
      inspection.assignmentResponseAt = undefined;
      inspection.assignmentResponseBy = undefined;
      inspection.rejectionReason = undefined;
      inspection.status = 'assigned';

      // Add notes about reassignment
      const reassignmentNote = `Auto-reassigned from ${oldStaffName} to ${inspection.assignedStaffName} (Reason: ${reason || 'Staff unavailability'})`;
      inspection.notes = inspection.notes ? `${inspection.notes}\n${reassignmentNote}` : reassignmentNote;

      await inspection.save();

      res.status(200).json({
        success: true,
        message: 'Inspection automatically reassigned to best available staff',
        data: {
          inspection,
          reassignmentDetails: {
            from: { id: oldStaffId, name: oldStaffName },
            to: { id: bestStaff.staffId, name: bestStaff.staffName },
            reason: reason || 'Automatic reassignment due to staff unavailability',
            confidence: bestStaff.confidence,
            reasoning: bestStaff.reason
          }
        }
      });

    } catch (error) {
      console.error('Error auto-reassigning inspection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get inspection details with staff response status
   * GET /api/inspections/:inspectionId
   */
  static async getInspection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const userId = req.user?.userId;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        organizationId
      }).populate('propertyId').populate('clientId');

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
        return;
      }

      // Check if user has permission to view this inspection
      const isAssignedStaff = inspection.assignedStaffId.toString() === userId;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'organization';

      if (!isAssignedStaff && !isAdmin) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: inspection
      });

    } catch (error) {
      console.error('Error getting inspection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get pending inspections for staff member
   * GET /api/inspections/staff/pending
   */
  static async getPendingInspections(req: AuthRequest, res: Response): Promise<void> {
    try {
      const staffId = req.user?.userId;
      const organizationId = req.user?.organizationId;

      if (!staffId || !organizationId) {
        res.status(401).json({
          success: false,
          message: 'Staff ID or Organization ID not found in token'
        });
        return;
      }

      const pendingInspections = await Inspection.find({
        assignedStaffId: staffId,
        organizationId,
        assignmentStatus: 'pending',
        status: 'assigned'
      }).populate('propertyId').sort({ scheduledDate: 1, startTime: 1 });

      res.status(200).json({
        success: true,
        data: pendingInspections
      });

    } catch (error) {
      console.error('Error getting pending inspections:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Staff starts an inspection (with optional location tracking)
   * PUT /api/inspections/:inspectionId/start
   */
  static async startInspection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const { enableLocationTracking = false, startingLocation } = req.body;
      const staffId = req.user?.userId;

      if (!staffId) {
        res.status(401).json({
          success: false,
          message: 'Staff ID not found in token'
        });
        return;
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        assignedStaffId: staffId,
        status: 'scheduled',
        assignmentStatus: 'accepted'
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found or not ready to start'
        });
        return;
      }

      // Update inspection status to in progress
      inspection.status = 'in_progress';

      // Enable location tracking if requested
      if (enableLocationTracking) {
        (inspection.locationTracking as any).isEnabled = true;
        (inspection.locationTracking as any).startTime = new Date();

        // If starting location is provided, create initial location update
        if (startingLocation && startingLocation.latitude && startingLocation.longitude) {
          const { LocationUpdate } = await import('../models/LocationUpdate');
          await LocationUpdate.create({
            inspectionId,
            userId: staffId,
            userType: 'staff',
            organizationId: req.user?.organizationId,
            latitude: startingLocation.latitude,
            longitude: startingLocation.longitude,
            accuracy: startingLocation.accuracy,
            status: 'traveling_to_property',
            timestamp: new Date(),
            isRealTime: true
          });
        }
      }

      await inspection.save();

      res.status(200).json({
        success: true,
        message: 'Inspection started successfully',
        data: {
          inspectionId: inspection._id,
          status: inspection.status,
          locationTracking: {
            enabled: inspection.locationTracking.isEnabled,
            startTime: inspection.locationTracking.startTime
          }
        }
      });

    } catch (error) {
      console.error('Error starting inspection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Staff completes an inspection
   * PUT /api/inspections/:inspectionId/complete
   */
  static async completeInspection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const { duration, outcome, notes, recommendations, finalLocation } = req.body;
      const staffId = req.user?.userId;

      if (!staffId) {
        res.status(401).json({
          success: false,
          message: 'Staff ID not found in token'
        });
        return;
      }

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        assignedStaffId: staffId,
        status: 'in_progress'
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found or not in progress'
        });
        return;
      }

      // Update inspection status to completed
      inspection.status = 'completed';
      inspection.notes = notes || inspection.notes;

      // Complete location tracking if enabled
      if (inspection.locationTracking.isEnabled) {
        (inspection.locationTracking as any).endTime = new Date();

        // Calculate total distance and average speed from location updates
        const { LocationUpdate } = await import('../models/LocationUpdate');
        const locationUpdates = await LocationUpdate.find({ inspectionId, userType: 'staff' })
          .sort({ timestamp: 1 });

        if (locationUpdates.length > 1) {
          let totalDistance = 0;
          let totalTime = 0;

          for (let i = 1; i < locationUpdates.length; i++) {
            const prev = locationUpdates[i - 1];
            const current = locationUpdates[i];

            const distance = Math.sqrt(
              Math.pow(current.latitude - prev.latitude, 2) +
              Math.pow(current.longitude - prev.longitude, 2)
            ) * 111; // Rough conversion from degrees to km

            totalDistance += distance;

            const timeDiff = (current.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60); // hours
            if (timeDiff > 0) {
              totalTime += timeDiff;
            }
          }

          inspection.locationTracking.totalDistance = totalDistance;
          inspection.locationTracking.averageSpeed = totalTime > 0 ? totalDistance / totalTime : 0;
        }

        // Create final location update if provided
        if (finalLocation && finalLocation.latitude && finalLocation.longitude) {
          await LocationUpdate.create({
            inspectionId,
            userId: staffId,
            userType: 'staff',
            organizationId: req.user?.organizationId,
            latitude: finalLocation.latitude,
            longitude: finalLocation.longitude,
            accuracy: finalLocation.accuracy,
            status: 'completed',
            notes: `Inspection completed. Outcome: ${outcome}`,
            timestamp: new Date(),
            isRealTime: true
          });
        }
      }

      await inspection.save();

      res.status(200).json({
        success: true,
        message: 'Inspection completed successfully',
        data: {
          inspectionId: inspection._id,
          status: inspection.status,
          duration: duration,
          outcome: outcome,
          locationTracking: inspection.locationTracking
        }
      });

    } catch (error) {
      console.error('Error completing inspection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
