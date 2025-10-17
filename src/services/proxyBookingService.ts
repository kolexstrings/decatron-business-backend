import { BookingService, CreateBookingRequest, BookingResponse } from './bookingService';
import { Property } from '../models/Property';
import { User } from '../models/User';
import mongoose from 'mongoose';

export interface ProxyBookingRequest extends CreateBookingRequest {
  bookedBy: mongoose.Types.ObjectId; // Staff/Admin who made the booking
  clientType: 'walk_in' | 'phone' | 'existing_client';
  notes?: string; // Additional notes from staff
}

export class ProxyBookingService {
  /**
   * Create a booking on behalf of a client (walk-in, phone, or existing client)
   */
  static async createProxyBooking(
    organizationId: string,
    bookingRequest: ProxyBookingRequest
  ): Promise<BookingResponse & { bookedBy: mongoose.Types.ObjectId }> {
    try {
      // Validate that the staff/admin making the booking belongs to the organization
      const staff = await User.findById(bookingRequest.bookedBy);
      if (!staff || staff.organizationId !== organizationId) {
        return {
          success: false,
          message: 'Unauthorized: Staff member not found in this organization'
        } as any;
      }

      // For existing clients, verify they exist in the organization
      if (bookingRequest.clientType === 'existing_client' && bookingRequest.clientId) {
        const client = await User.findById(bookingRequest.clientId);
        if (!client || client.organizationId !== organizationId) {
          return {
            success: false,
            message: 'Client not found in this organization'
          } as any;
        }
      }

      // Use the existing booking service but with additional tracking
      const result = await BookingService.createBooking(organizationId, bookingRequest);

      if (result.success) {
        return {
          ...result,
          bookedBy: bookingRequest.bookedBy
        };
      }

      return result as any;

    } catch (error) {
      console.error('Error creating proxy booking:', error);
      return {
        success: false,
        message: 'Failed to create booking. Please try again.'
      } as any;
    }
  }

  /**
   * Get bookings made by a specific staff member (proxy bookings)
   */
  static async getProxyBookingsByStaff(
    staffId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    // This would require adding a bookedBy field to the Booking model
    // For now, return empty array as this feature needs model updates
    return [];
  }

  /**
   * Get walk-in client bookings
   */
  static async getWalkInBookings(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    // This would require tracking which bookings are walk-in vs online
    // For now, return empty array as this feature needs model updates
    return [];
  }
}
