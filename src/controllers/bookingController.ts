import { Request, Response } from 'express';
import { BookingService, CreateBookingRequest, BookingResponse } from '../services/bookingService';
import { IntelligentStaffAssignmentService, AvailabilityCheckResult } from '../services/intelligentStaffAssignmentService';
import { Property } from '../models/Property';
import { Booking } from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

export class BookingController {
  /**
   * Create a new booking
   * POST /api/bookings
   */
  static async createBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }
      const bookingRequest: CreateBookingRequest = {
        propertyId: req.body.propertyId,
        clientName: req.body.clientName,
        clientEmail: req.body.clientEmail,
        clientPhone: req.body.clientPhone,
        requestedDate: new Date(req.body.requestedDate),
        preferredTimeSlot: req.body.preferredTimeSlot,
        clientId: req.body.clientId,
        source: req.body.source || 'web',
        priority: req.body.priority || 'normal',
        duration: req.body.duration || 60
      };

      // Validate required fields
      if (!bookingRequest.propertyId || !bookingRequest.clientName ||
          !bookingRequest.clientEmail || !bookingRequest.clientPhone ||
          !bookingRequest.requestedDate || !bookingRequest.preferredTimeSlot) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate time slot format
      if (!/^\d{2}:\d{2}$/.test(bookingRequest.preferredTimeSlot.startTime) ||
          !/^\d{2}:\d{2}$/.test(bookingRequest.preferredTimeSlot.endTime)) {
        res.status(400).json({
          success: false,
          message: 'Invalid time format. Use HH:mm'
        });
        return;
      }

      const result: BookingResponse = await BookingService.createBooking(
        organizationId,
        bookingRequest
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            booking: result.booking,
            inspection: result.inspection
          },
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          suggestedAlternatives: result.suggestedAlternatives
        });
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check availability for a time slot and get suggestions
   * POST /api/bookings/check-availability
   */
  static async checkAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }
      const { propertyId, requestedDate, startTime, duration = 60 } = req.body;

      if (!propertyId || !requestedDate || !startTime) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: propertyId, requestedDate, startTime'
        });
        return;
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        res.status(404).json({
          success: false,
          message: 'Property not found'
        });
        return;
      }

      const availabilityCheck: AvailabilityCheckResult =
        await IntelligentStaffAssignmentService.checkAvailabilityAndSuggestAlternatives(
          organizationId,
          property,
          new Date(requestedDate),
          startTime,
          duration
        );

      res.status(200).json({
        success: true,
        data: availabilityCheck
      });

    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get booking by ID
   * GET /api/bookings/:bookingId
   */
  static async getBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const booking = await BookingService.getBookingById(bookingId, organizationId);

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Error getting booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get bookings by client email
   * GET /api/bookings/client/:email
   */
  static async getBookingsByClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const bookings = await BookingService.getBookingsByClient(email, organizationId);

      res.status(200).json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Error getting bookings by client:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get bookings by property
   * GET /api/bookings/property/:propertyId
   */
  static async getBookingsByProperty(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const bookings = await BookingService.getBookingsByProperty(propertyId, organizationId);

      res.status(200).json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Error getting bookings by property:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get bookings by staff member
   * GET /api/bookings/staff/:staffId
   */
  static async getBookingsByStaff(req: AuthRequest, res: Response): Promise<void> {
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
      const { startDate, endDate } = req.query;

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(startDate as string);
      }
      if (endDate) {
        end = new Date(endDate as string);
      }

      const bookings = await BookingService.getBookingsByStaff(staffId, organizationId, start, end);

      res.status(200).json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Error getting bookings by staff:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Cancel a booking
   * PUT /api/bookings/:bookingId/cancel
   */
  static async cancelBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }
      const { reason } = req.body;

      const result = await BookingService.cancelBooking(bookingId, organizationId, reason);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Reschedule a booking
   * PUT /api/bookings/:bookingId/reschedule
   */
  static async rescheduleBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }
      const { requestedDate, preferredTimeSlot, duration } = req.body;

      if (!requestedDate || !preferredTimeSlot) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: requestedDate, preferredTimeSlot'
        });
        return;
      }

      const result: BookingResponse = await BookingService.rescheduleBooking(
        bookingId,
        organizationId,
        new Date(requestedDate),
        preferredTimeSlot,
        duration
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            booking: result.booking,
            inspection: result.inspection
          },
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          suggestedAlternatives: result.suggestedAlternatives
        });
      }

    } catch (error) {
      console.error('Error rescheduling booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get upcoming bookings for organization
   * GET /api/bookings/upcoming
   */
  static async getUpcomingBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }
      const { days = '7' } = req.query;

      const bookings = await BookingService.getUpcomingBookings(
        organizationId,
        parseInt(days as string)
      );

      res.status(200).json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Error getting upcoming bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get booking statistics
   * GET /api/bookings/stats
   */
  static async getBookingStats(req: AuthRequest, res: Response): Promise<void> {
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

      let start: Date | undefined;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(startDate as string);
      }
      if (endDate) {
        end = new Date(endDate as string);
      }

      const stats = await BookingService.getBookingStats(organizationId, start, end);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting booking stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get available time slots for a property and date
   * GET /api/bookings/availability/:propertyId/:date
   */
  static async getAvailableTimeSlots(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { propertyId, date } = req.params;
      const organizationId = req.user?.organizationId;

      const property = await Property.findById(propertyId);
      if (!property) {
        res.status(404).json({
          success: false,
          message: 'Property not found'
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

      // Generate time slots for the day (9 AM to 6 PM, every 30 minutes)
      const timeSlots = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endTime = `${(hour + Math.floor((minute + 60) / 60)).toString().padStart(2, '0')}:${((minute + 60) % 60).toString().padStart(2, '0')}`;

          const availabilityCheck = await IntelligentStaffAssignmentService.checkAvailabilityAndSuggestAlternatives(
            organizationId as string,
            property,
            requestedDate,
            startTime,
            60 // Default 1 hour duration
          );

          timeSlots.push({
            startTime,
            endTime,
            available: availabilityCheck.isAvailable,
            availableStaff: availabilityCheck.availableStaff.length,
            suggestedAlternatives: availabilityCheck.suggestedAlternatives
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          date: requestedDate,
          timeSlots
        }
      });

    } catch (error) {
      console.error('Error getting available time slots:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
