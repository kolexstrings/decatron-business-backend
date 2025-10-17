import { IBooking, Booking } from '../models/Booking';
import { IInspection, Inspection } from '../models/Inspection';
import { IProperty, Property } from '../models/Property';
import { IUser } from '../models/User';
import { IntelligentStaffAssignmentService, AvailabilityCheckResult } from './intelligentStaffAssignmentService';
import mongoose from 'mongoose';

export interface CreateBookingRequest {
  propertyId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  requestedDate: Date;
  preferredTimeSlot: {
    startTime: string;
    endTime: string;
  };
  clientId?: string;
  source?: 'web' | 'mobile' | 'phone' | 'walk_in';
  priority?: 'normal' | 'urgent' | 'vip';
  duration?: number; // Default 60 minutes
}

export interface BookingResponse {
  success: boolean;
  booking?: IBooking;
  inspection?: IInspection;
  message: string;
  suggestedAlternatives?: AvailabilityCheckResult['suggestedAlternatives'];
}

export class BookingService {
  /**
   * Create a new booking with intelligent staff assignment
   */
  static async createBooking(
    organizationId: string,
    bookingRequest: CreateBookingRequest
  ): Promise<BookingResponse> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Get property details
      const property = await Property.findById(bookingRequest.propertyId);
      if (!property) {
        return {
          success: false,
          message: 'Property not found'
        };
      }

      // Check availability and get suggested alternatives if needed
      const availabilityCheck = await IntelligentStaffAssignmentService.checkAvailabilityAndSuggestAlternatives(
        organizationId,
        property,
        bookingRequest.requestedDate,
        bookingRequest.preferredTimeSlot.startTime,
        bookingRequest.duration || 60
      );

      if (!availabilityCheck.isAvailable) {
        // No staff available for preferred time, return suggestions
        return {
          success: false,
          message: 'No staff available for the requested time slot. Please choose an alternative time.',
          suggestedAlternatives: availabilityCheck.suggestedAlternatives
        };
      }

      // Create the booking record
      const booking = new Booking({
        organizationId,
        propertyId: bookingRequest.propertyId,
        propertyTitle: property.title,
        clientId: bookingRequest.clientId,
        clientName: bookingRequest.clientName,
        clientEmail: bookingRequest.clientEmail,
        clientPhone: bookingRequest.clientPhone,
        requestedDate: bookingRequest.requestedDate,
        preferredTimeSlot: bookingRequest.preferredTimeSlot,
        status: 'confirmed', // Auto-confirm if staff is available
        source: bookingRequest.source || 'web',
        priority: bookingRequest.priority || 'normal',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      await booking.save({ session });

      // Assign staff using intelligent algorithm
      const bestStaff = availabilityCheck.availableStaff[0];
      if (!bestStaff) {
        throw new Error('No staff available despite availability check');
      }

      // Get staff user details
      const staffUser = await mongoose.model<IUser>('User').findById(bestStaff.staffId);
      if (!staffUser) {
        throw new Error('Assigned staff not found');
      }

      // Create the inspection record
      const inspection = new Inspection({
        organizationId,
        propertyId: bookingRequest.propertyId,
        propertyTitle: property.title,
        propertyLocation: property.location,
        clientId: bookingRequest.clientId,
        clientName: bookingRequest.clientName,
        clientEmail: bookingRequest.clientEmail,
        clientPhone: bookingRequest.clientPhone,
        assignedStaffId: bestStaff.staffId,
        assignedStaffName: bestStaff.staffName,
        scheduledDate: bookingRequest.requestedDate,
        startTime: bookingRequest.preferredTimeSlot.startTime,
        endTime: bookingRequest.preferredTimeSlot.endTime,
        duration: bookingRequest.duration || 60,
        status: 'scheduled',
        staffPreviousInspection: bestStaff.previousInspection
      });

      await inspection.save({ session });

      // Update booking with inspection reference
      booking.assignedStaffId = bestStaff.staffId;
      booking.assignedInspectionId = (inspection as any)._id as mongoose.Types.ObjectId;
      await booking.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        booking,
        inspection: inspection || undefined,
        message: `Inspection scheduled successfully with ${bestStaff.staffName}. ${bestStaff.reason}`
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Error creating booking:', error);

      return {
        success: false,
        message: 'Failed to create booking. Please try again.'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string, organizationId: string): Promise<IBooking | null> {
    return await Booking.findOne({
      _id: bookingId,
      organizationId
    }).populate('assignedInspectionId');
  }

  /**
   * Get bookings by client email
   */
  static async getBookingsByClient(clientEmail: string, organizationId: string): Promise<IBooking[]> {
    return await Booking.find({
      clientEmail,
      organizationId
    }).populate('assignedInspectionId').sort({ createdAt: -1 });
  }

  /**
   * Get bookings by property
   */
  static async getBookingsByProperty(propertyId: string, organizationId: string): Promise<IBooking[]> {
    return await Booking.find({
      propertyId,
      organizationId
    }).populate('assignedInspectionId').sort({ requestedDate: 1 });
  }

  /**
   * Get bookings by staff member
   */
  static async getBookingsByStaff(staffId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<IBooking[]> {
    const query: any = {
      assignedStaffId: staffId,
      organizationId
    };

    if (startDate || endDate) {
      query.requestedDate = {};
      if (startDate) query.requestedDate.$gte = startDate;
      if (endDate) query.requestedDate.$lte = endDate;
    }

    return await Booking.find(query)
      .populate('assignedInspectionId')
      .sort({ requestedDate: 1 });
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(
    bookingId: string,
    organizationId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const booking = await Booking.findOne({
        _id: bookingId,
        organizationId
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.statusMessage = reason;
      await booking.save({ session });

      // Update associated inspection if exists
      if (booking.assignedInspectionId) {
        const inspection = await Inspection.findById(booking.assignedInspectionId);
        if (inspection) {
          inspection.status = 'cancelled';
          inspection.cancellationReason = reason;
          await inspection.save({ session });
        }
      }

      await session.commitTransaction();

      return {
        success: true,
        message: 'Booking cancelled successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Error cancelling booking:', error);

      return {
        success: false,
        message: 'Failed to cancel booking'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Reschedule a booking
   */
  static async rescheduleBooking(
    bookingId: string,
    organizationId: string,
    newDate: Date,
    newTimeSlot: { startTime: string; endTime: string },
    newDuration?: number
  ): Promise<BookingResponse> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const booking = await Booking.findOne({
        _id: bookingId,
        organizationId
      });

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found'
        };
      }

      // Get property details
      const property = await Property.findById(booking.propertyId);
      if (!property) {
        return {
          success: false,
          message: 'Property not found'
        };
      }

      // Check availability for new time slot
      const availabilityCheck = await IntelligentStaffAssignmentService.checkAvailabilityAndSuggestAlternatives(
        organizationId,
        property,
        newDate,
        newTimeSlot.startTime,
        newDuration || 60
      );

      if (!availabilityCheck.isAvailable) {
        return {
          success: false,
          message: 'No staff available for the requested time slot. Please choose an alternative time.',
          suggestedAlternatives: availabilityCheck.suggestedAlternatives
        };
      }

      // Update booking
      booking.requestedDate = newDate;
      booking.preferredTimeSlot = newTimeSlot;
      booking.status = 'confirmed';
      await booking.save({ session });

      // Update or create inspection
      let inspection;
      if (booking.assignedInspectionId) {
        inspection = await Inspection.findById(booking.assignedInspectionId);
        if (inspection) {
          inspection.scheduledDate = newDate;
          inspection.startTime = newTimeSlot.startTime;
          inspection.endTime = newTimeSlot.endTime;
          inspection.duration = newDuration || 60;
          inspection.status = 'scheduled';
          await inspection.save({ session });
        }
      } else {
        // Create new inspection if none exists
        const bestStaff = availabilityCheck.availableStaff[0];
        if (!bestStaff) {
          throw new Error('No staff available despite availability check');
        }

        inspection = new Inspection({
          organizationId,
          propertyId: booking.propertyId,
          propertyTitle: property.title,
          propertyLocation: property.location,
          clientId: booking.clientId,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          clientPhone: booking.clientPhone,
          assignedStaffId: bestStaff.staffId,
          assignedStaffName: bestStaff.staffName,
          scheduledDate: newDate,
          startTime: newTimeSlot.startTime,
          endTime: newTimeSlot.endTime,
          duration: newDuration || 60,
          status: 'scheduled',
          staffPreviousInspection: bestStaff.previousInspection
        });

        await inspection.save({ session });
        booking.assignedInspectionId = (inspection as any)._id as mongoose.Types.ObjectId;
        await booking.save({ session });
      }

      await session.commitTransaction();

      return {
        success: true,
        booking,
        inspection: inspection || undefined,
        message: 'Booking rescheduled successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Error rescheduling booking:', error);

      return {
        success: false,
        message: 'Failed to reschedule booking'
      };
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get upcoming bookings for organization
   */
  static async getUpcomingBookings(organizationId: string, daysAhead: number = 7): Promise<IBooking[]> {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return await Booking.find({
      organizationId,
      requestedDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'pending'] }
    })
    .populate('assignedInspectionId')
    .sort({ requestedDate: 1, 'preferredTimeSlot.startTime': 1 });
  }

  /**
   * Get booking statistics for organization
   */
  static async getBookingStats(organizationId: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    pending: number;
  }> {
    const matchQuery: any = { organizationId };

    if (startDate || endDate) {
      matchQuery.requestedDate = {};
      if (startDate) matchQuery.requestedDate.$gte = startDate;
      if (endDate) matchQuery.requestedDate.$lte = endDate;
    }

    const stats = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      pending: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      if (stat._id === 'confirmed') result.confirmed = stat.count;
      if (stat._id === 'cancelled') result.cancelled = stat.count;
      if (stat._id === 'completed') result.completed = stat.count;
      if (stat._id === 'pending') result.pending = stat.count;
    });

    return result;
  }
}
