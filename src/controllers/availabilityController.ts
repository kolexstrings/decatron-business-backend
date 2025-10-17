import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';

export class AvailabilityController {
  // Create a new availability schedule
  static async createAvailability(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        description,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        timeSlotDuration,
        bufferTime
      } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Name is required'
        });
      }

      const availability = await AuthService.createAvailability({
        organizationId: req.user!.organizationId!,
        name,
        description,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        timeSlotDuration,
        bufferTime
      });

      res.status(201).json({
        message: 'Availability schedule created successfully',
        availability: {
          id: availability.id,
          name: availability.name,
          description: availability.description,
          isActive: availability.isActive,
          timeSlotDuration: availability.timeSlotDuration,
          bufferTime: availability.bufferTime,
          createdAt: availability.createdAt
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get all availabilities for an organization
  static async getOrganizationAvailabilities(req: AuthRequest, res: Response) {
    try {
      const availabilities = await AuthService.getOrganizationAvailabilities(req.user!.organizationId!);

      const formattedAvailabilities = availabilities.map(availability => ({
        id: availability.id,
        name: availability.name,
        description: availability.description,
        isActive: availability.isActive,
        timeSlotDuration: availability.timeSlotDuration,
        bufferTime: availability.bufferTime,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt
      }));

      res.json({ availabilities: formattedAvailabilities });
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get a specific availability
  static async getAvailability(req: AuthRequest, res: Response) {
    try {
      const { availabilityId } = req.params;

      const availability = await AuthService.getAvailabilityById(
        availabilityId,
        req.user!.organizationId!
      );

      res.json({
        availability: {
          id: availability.id,
          name: availability.name,
          description: availability.description,
          isActive: availability.isActive,
          monday: availability.monday,
          tuesday: availability.tuesday,
          wednesday: availability.wednesday,
          thursday: availability.thursday,
          friday: availability.friday,
          saturday: availability.saturday,
          sunday: availability.sunday,
          timeSlotDuration: availability.timeSlotDuration,
          bufferTime: availability.bufferTime,
          createdAt: availability.createdAt,
          updatedAt: availability.updatedAt
        }
      });
    } catch (error: any) {
      if (error.message === 'Availability not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Update an availability schedule
  static async updateAvailability(req: AuthRequest, res: Response) {
    try {
      const { availabilityId } = req.params;
      const updateData = req.body;

      const availability = await AuthService.updateAvailability(
        availabilityId,
        req.user!.organizationId!,
        updateData
      );

      res.json({
        message: 'Availability updated successfully',
        availability: {
          id: availability.id,
          name: availability.name,
          description: availability.description,
          isActive: availability.isActive,
          monday: availability.monday,
          tuesday: availability.tuesday,
          wednesday: availability.wednesday,
          thursday: availability.thursday,
          friday: availability.friday,
          saturday: availability.saturday,
          sunday: availability.sunday,
          timeSlotDuration: availability.timeSlotDuration,
          bufferTime: availability.bufferTime,
          updatedAt: availability.updatedAt
        }
      });
    } catch (error: any) {
      if (error.message === 'Availability not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Delete an availability schedule
  static async deleteAvailability(req: AuthRequest, res: Response) {
    try {
      const { availabilityId } = req.params;

      await AuthService.deleteAvailability(availabilityId, req.user!.organizationId!);

      res.json({ message: 'Availability deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Availability not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Get available time slots for a specific date
  static async getAvailableTimeSlots(req: AuthRequest, res: Response) {
    try {
      const { availabilityId } = req.params;
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD format)' });
      }

      // Parse the date string into a Date object
      const targetDate = new Date(date);

      // Validate the date
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD format' });
      }

      const timeSlots = await AuthService.getAvailableTimeSlots(
        availabilityId,
        req.user!.organizationId!,
        targetDate
      );

      res.json({
        date,
        availabilityId,
        timeSlots
      });
    } catch (error: any) {
      if (error.message === 'Availability not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
