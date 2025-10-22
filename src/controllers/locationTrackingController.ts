import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LocationUpdate, ILocationUpdate } from '../models/LocationUpdate';
import { Inspection } from '../models/Inspection';
import mongoose from 'mongoose';
import { WebSocketService } from '../services/webSocketService';

export class LocationTrackingController {

  /**
   * Staff or client updates their real-time location during inspection
   * POST /api/location/track
   * Also available via WebSocket: emit 'location-update'
   */
  static async updateLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId, latitude, longitude, accuracy, altitude, speed, heading, status, notes } = req.body;
      const userId = req.user?.userId;
      const userType = req.user?.role === 'staff' || req.user?.role === 'agent' ? 'staff' : 'client';

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User ID not found in token'
        });
        return;
      }

      if (!inspectionId || !latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Inspection ID, latitude, and longitude are required'
        });
        return;
      }

      // Verify inspection exists and user is involved
      const inspection = await Inspection.findOne({
        _id: inspectionId,
        organizationId: req.user?.organizationId,
        $or: [
          { assignedStaffId: userId },
          { clientId: userId }
        ]
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found or user not authorized'
        });
        return;
      }

      // Create location update
      const locationUpdate = new LocationUpdate({
        inspectionId,
        userId,
        userType,
        organizationId: req.user?.organizationId,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        status,
        notes,
        timestamp: new Date(),
        isRealTime: true
      });

      await locationUpdate.save();

      // Broadcast real-time update via WebSocket if available
      WebSocketService.broadcastLocationUpdate(inspectionId, {
        userId: userId,
        userType: userType,
        latitude: latitude,
        longitude: longitude,
        timestamp: locationUpdate.timestamp,
        status: status,
        speed: speed,
        heading: heading
      });

      res.status(201).json({
        success: true,
        message: 'Location updated successfully',
        data: {
          id: locationUpdate._id,
          latitude: locationUpdate.latitude,
          longitude: locationUpdate.longitude,
          timestamp: locationUpdate.timestamp,
          status: locationUpdate.status,
          method: 'http'
        }
      });

    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get location history for an inspection
   * GET /api/location/inspection/:inspectionId
   */
  static async getInspectionLocationHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inspectionId } = req.params;
      const { userType } = req.query;
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
      });

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
        return;
      }

      const query: any = { inspectionId };
      if (userType && ['staff', 'client'].includes(userType as string)) {
        query.userType = userType;
      }

      const locationHistory = await LocationUpdate.find(query)
        .sort({ timestamp: 1 })
        .populate('userId', 'username profile.firstName profile.lastName');

      res.status(200).json({
        success: true,
        data: locationHistory
      });

    } catch (error) {
      console.error('Error getting location history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get current locations of all parties in an inspection
   * GET /api/location/inspection/:inspectionId/current
   */
  static async getCurrentLocations(req: AuthRequest, res: Response): Promise<void> {
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

      const inspection = await Inspection.findOne({
        _id: inspectionId,
        organizationId
      }).populate('propertyId');

      if (!inspection) {
        res.status(404).json({
          success: false,
          message: 'Inspection not found'
        });
        return;
      }

      const [staffLocation, clientLocation] = await Promise.all([
        LocationUpdate.findOne({ inspectionId, userType: 'staff' })
          .sort({ timestamp: -1 })
          .populate('userId', 'username profile.firstName profile.lastName'),
        LocationUpdate.findOne({ inspectionId, userType: 'client' })
          .sort({ timestamp: -1 })
          .populate('userId', 'username profile.firstName profile.lastName')
      ]);

      const property = inspection.propertyId as any;
      const propertyLocation = property?.location ? {
        latitude: property.location.latitude,
        longitude: property.location.longitude,
        address: property.location.address,
        city: property.location.city,
        type: 'property'
      } : null;

      const organizationLocation = await LocationTrackingController.getOrganizationLocation(organizationId);
      const connectedUsers = WebSocketService.getConnectedUsersForInspection(inspectionId);

      res.status(200).json({
        success: true,
        data: {
          inspection: {
            id: inspection._id,
            status: inspection.status,
            scheduledDate: inspection.scheduledDate
          },
          locations: {
            staff: staffLocation ? {
              latitude: staffLocation.latitude,
              longitude: staffLocation.longitude,
              timestamp: staffLocation.timestamp,
              status: staffLocation.status,
              user: staffLocation.userId,
              isOnline: connectedUsers.includes(staffLocation.userId.toString())
            } : null,
            client: clientLocation ? {
              latitude: clientLocation.latitude,
              longitude: clientLocation.longitude,
              timestamp: clientLocation.timestamp,
              status: clientLocation.status,
              user: clientLocation.userId,
              isOnline: connectedUsers.includes(clientLocation.userId.toString())
            } : null,
            property: propertyLocation,
            organization: organizationLocation
          },
          connectedUsers: connectedUsers,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Error getting current locations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Calculate distance and ETA between two points
   * POST /api/location/distance
   */
  static async calculateDistance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { fromLat, fromLng, toLat, toLng, mode = 'driving' } = req.body;

      if (!fromLat || !fromLng || !toLat || !toLng) {
        res.status(400).json({
          success: false,
          message: 'From and to coordinates are required'
        });
        return;
      }

      const distance = LocationTrackingController.calculateHaversineDistance(
        fromLat, fromLng, toLat, toLng
      );

      const speedKmh = mode === 'walking' ? 5 : mode === 'driving' ? 40 : 30;
      const timeMinutes = (distance / speedKmh) * 60;

      res.status(200).json({
        success: true,
        data: {
          distance: Math.round(distance * 100) / 100,
          distanceUnit: 'km',
          estimatedTime: Math.round(timeMinutes),
          timeUnit: 'minutes',
          mode: mode
        }
      });

    } catch (error) {
      console.error('Error calculating distance:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Haversine formula for calculating distance between two points
   */
  private static calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get organization office location
   */
  private static async getOrganizationLocation(organizationId: string): Promise<any> {
    try {
      return {
        id: 'organization',
        name: 'Office',
        type: 'organization',
        latitude: 9.0765,
        longitude: 8.6753,
        address: 'Organization Office',
        city: 'Abuja',
        state: 'FCT'
      };
    } catch (error) {
      console.error('Error getting organization location:', error);
      return null;
    }
  }
}
