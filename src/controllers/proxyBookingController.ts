import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProxyBookingService, ProxyBookingRequest } from '../services/proxyBookingService';
import { Property } from '../models/Property';
import mongoose from 'mongoose';

export class ProxyBookingController {
  /**
   * Staff/Admin creates a booking on behalf of a client
   * POST /api/proxy-bookings
   */
  static async createProxyBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({
          success: false,
          message: 'Organization ID not found in token'
        });
        return;
      }

      const bookingRequest: ProxyBookingRequest = {
        propertyId: req.body.propertyId,
        clientName: req.body.clientName,
        clientEmail: req.body.clientEmail,
        clientPhone: req.body.clientPhone,
        requestedDate: new Date(req.body.requestedDate),
        preferredTimeSlot: req.body.preferredTimeSlot,
        clientId: req.body.clientId, // Optional for walk-in clients
        source: 'proxy', // Mark as proxy booking
        priority: req.body.priority || 'normal',
        duration: req.body.duration || 60,
        bookedBy: new mongoose.Types.ObjectId(req.user!.userId), // Staff who made the booking
        clientType: req.body.clientType, // 'walk_in' | 'phone' | 'existing_client'
        notes: req.body.notes
      };

      // Validate required fields
      if (!bookingRequest.propertyId || !bookingRequest.clientName ||
          !bookingRequest.clientEmail || !bookingRequest.clientPhone ||
          !bookingRequest.requestedDate || !bookingRequest.preferredTimeSlot ||
          !bookingRequest.clientType) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate client type
      if (!['walk_in', 'phone', 'existing_client'].includes(bookingRequest.clientType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid client type. Must be walk_in, phone, or existing_client'
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

      const result = await ProxyBookingService.createProxyBooking(
        organizationId,
        bookingRequest
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            booking: result.booking,
            inspection: result.inspection,
            bookedBy: result.bookedBy
          },
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          suggestedAlternatives: (result as any).suggestedAlternatives
        });
      }

    } catch (error) {
      console.error('Error creating proxy booking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get available time slots for proxy booking (same as regular booking)
   * POST /api/proxy-bookings/check-availability
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

      // Import and use the existing availability check service
      const { IntelligentStaffAssignmentService } = await import('../services/intelligentStaffAssignmentService');

      const availabilityCheck = await IntelligentStaffAssignmentService.checkAvailabilityAndSuggestAlternatives(
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
      console.error('Error checking proxy booking availability:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
