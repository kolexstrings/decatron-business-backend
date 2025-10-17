import { Request, Response } from 'express';
import { StaffSchedule, IStaffSchedule } from '../models/StaffSchedule';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export interface CreateStaffScheduleRequest {
  staffId: string;
  weeklySchedule: Array<{
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    isWorking: boolean;
    startTime?: string;
    endTime?: string;
    breakStart?: string;
    breakEnd?: string;
    maxInspections?: number;
  }>;
  isActive?: boolean;
  maxConcurrentInspections?: number;
  preferredInspectionDuration?: number;
  maxTravelTime?: number;
  workArea?: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
}

export interface UpdateStaffScheduleRequest extends Partial<CreateStaffScheduleRequest> {}

export class StaffScheduleController {
  /**
   * Create staff schedule
   * POST /api/staff-schedules
   */
  static async createStaffSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const scheduleData: CreateStaffScheduleRequest = req.body;

      // Validate required fields
      if (!scheduleData.staffId || !scheduleData.weeklySchedule) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: staffId, weeklySchedule'
        });
        return;
      }

      // Validate weekly schedule has all 7 days
      if (scheduleData.weeklySchedule.length !== 7) {
        res.status(400).json({
          success: false,
          message: 'Weekly schedule must include all 7 days'
        });
        return;
      }

      // Check if staff exists and belongs to organization
      const staff = await User.findById(scheduleData.staffId);
      if (!staff || staff.organizationId !== organizationId) {
        res.status(404).json({
          success: false,
          message: 'Staff member not found or does not belong to your organization'
        });
        return;
      }

      // Check if schedule already exists for this staff
      const existingSchedule = await StaffSchedule.findOne({ staffId: scheduleData.staffId });
      if (existingSchedule) {
        res.status(409).json({
          success: false,
          message: 'Schedule already exists for this staff member'
        });
        return;
      }

      const schedule = new StaffSchedule({
        organizationId,
        staffId: scheduleData.staffId,
        staffName: `${staff.profile?.firstName || ''} ${staff.profile?.lastName || ''}`.trim() || staff.username,
        weeklySchedule: scheduleData.weeklySchedule,
        isActive: scheduleData.isActive ?? true,
        maxConcurrentInspections: scheduleData.maxConcurrentInspections ?? 1,
        preferredInspectionDuration: scheduleData.preferredInspectionDuration ?? 60,
        maxTravelTime: scheduleData.maxTravelTime ?? 120,
        workArea: scheduleData.workArea
      });

      await schedule.save();

      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Staff schedule created successfully'
      });

    } catch (error) {
      console.error('Error creating staff schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get staff schedule by ID
   * GET /api/staff-schedules/:scheduleId
   */
  static async getStaffSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const schedule = await StaffSchedule.findOne({
        _id: scheduleId,
        organizationId
      });

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Staff schedule not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: schedule
      });

    } catch (error) {
      console.error('Error getting staff schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get staff schedule by staff ID
   * GET /api/staff-schedules/staff/:staffId
   */
  static async getStaffScheduleByStaffId(req: AuthRequest, res: Response): Promise<void> {
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

      const schedule = await StaffSchedule.findOne({
        staffId,
        organizationId
      });

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Staff schedule not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: schedule
      });

    } catch (error) {
      console.error('Error getting staff schedule by staff ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update staff schedule
   * PUT /api/staff-schedules/:scheduleId
   */
  static async updateStaffSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const updateData: UpdateStaffScheduleRequest = req.body;

      const schedule = await StaffSchedule.findOneAndUpdate(
        { _id: scheduleId, organizationId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Staff schedule not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'Staff schedule updated successfully'
      });

    } catch (error) {
      console.error('Error updating staff schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all active staff schedules for organization
   * GET /api/staff-schedules
   */
  static async getAllStaffSchedules(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const schedules = await StaffSchedule.findActiveStaff(organizationId);

      res.status(200).json({
        success: true,
        data: schedules
      });

    } catch (error) {
      console.error('Error getting all staff schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get staff schedule for a specific date
   * GET /api/staff-schedules/staff/:staffId/date/:date
   */
  static async getStaffScheduleForDate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { staffId, date } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const requestedDate = new Date(date);
      if (isNaN(requestedDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
        return;
      }

      const scheduleForDate = await StaffSchedule.getStaffScheduleForDate(staffId, requestedDate);

      if (!scheduleForDate) {
        res.status(404).json({
          success: false,
          message: 'No schedule found for this staff member on the specified date'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          staffId,
          date: requestedDate,
          schedule: scheduleForDate
        }
      });

    } catch (error) {
      console.error('Error getting staff schedule for date:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update staff performance metrics
   * PUT /api/staff-schedules/:scheduleId/metrics
   */
  static async updatePerformanceMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { inspectionStatus }: { inspectionStatus: string } = req.body;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      if (!inspectionStatus || !['completed', 'cancelled'].includes(inspectionStatus)) {
        res.status(400).json({
          success: false,
          message: 'Invalid inspection status. Must be "completed" or "cancelled"'
        });
        return;
      }

      // Get the schedule to find the staffId
      const schedule = await StaffSchedule.findOne({ _id: scheduleId, organizationId });
      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Staff schedule not found'
        });
        return;
      }

      const updatedSchedule = await StaffSchedule.updatePerformanceMetrics(
        schedule.staffId.toString(),
        inspectionStatus
      );

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: 'Performance metrics updated successfully'
      });

    } catch (error) {
      console.error('Error updating performance metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Toggle staff active status
   * PUT /api/staff-schedules/:scheduleId/toggle-active
   */
  static async toggleStaffActiveStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const schedule = await StaffSchedule.findOneAndUpdate(
        { _id: scheduleId, organizationId },
        [{ $set: { isActive: { $not: '$isActive' } } }],
        { new: true }
      );

      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Staff schedule not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: schedule,
        message: `Staff ${schedule.isActive ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error) {
      console.error('Error toggling staff active status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete staff schedule
   * DELETE /api/staff-schedules/:scheduleId
   */
  static async deleteStaffSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const deletedSchedule = await StaffSchedule.findOneAndDelete({
        _id: scheduleId,
        organizationId
      });

      if (!deletedSchedule) {
        res.status(404).json({
          success: false,
          message: 'Staff schedule not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Staff schedule deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting staff schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
