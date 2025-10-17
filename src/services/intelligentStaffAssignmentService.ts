import { IStaffSchedule, StaffSchedule } from '../models/StaffSchedule';
import { IInspection, Inspection } from '../models/Inspection';
import { IUser, User } from '../models/User';
import { IProperty } from '../models/Property';
import mongoose from 'mongoose';

// Utility function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Utility function to check if two time slots overlap
function timeSlotsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

// Utility function to add minutes to a time string
function addMinutesToTime(timeString: string, minutes: number): string {
  const [hours, mins] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

export interface StaffAssignmentResult {
  staffId: mongoose.Types.ObjectId;
  staffName: string;
  confidence: number; // 0-100, higher is better match
  reason: string; // Why this staff was chosen
  estimatedTravelTime?: number; // Minutes
  previousInspection?: {
    propertyId: mongoose.Types.ObjectId;
    endTime: Date;
    distance: number;
  };
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  availableStaff: StaffAssignmentResult[];
  suggestedAlternatives: Array<{
    date: Date;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
}

export class IntelligentStaffAssignmentService {
  /**
   * Find the best staff member for an inspection using intelligent assignment algorithm
   */
  static async findBestStaffForInspection(
    organizationId: string,
    property: IProperty,
    scheduledDate: Date,
    startTime: string,
    endTime: string,
    duration: number,
    excludeStaffId?: mongoose.Types.ObjectId
  ): Promise<StaffAssignmentResult | null> {
    try {
      // Get all active staff in the organization
      const activeStaff = await StaffSchedule.findActiveStaff(organizationId);
      if (activeStaff.length === 0) {
        return null;
      }

      const candidates: StaffAssignmentResult[] = [];

      for (const staffSchedule of activeStaff) {
        // Skip excluded staff
        if (excludeStaffId && staffSchedule.staffId.equals(excludeStaffId)) {
          continue;
        }

        // Check if staff is available for this time slot
        const availability = await this.checkStaffAvailability(
          staffSchedule,
          scheduledDate,
          startTime,
          endTime,
          duration
        );

        if (!availability.isAvailable) {
          continue;
        }

        // Calculate proximity score based on recent inspections
        const proximityScore = await this.calculateProximityScore(
          staffSchedule.staffId,
          property,
          scheduledDate,
          startTime
        );

        // Calculate overall confidence score
        const baseScore = availability.concurrentSlots < staffSchedule.maxConcurrentInspections ? 80 : 50;
        const confidence = Math.min(100, baseScore + proximityScore);

        // Get staff details
        const staff = await User.findById(staffSchedule.staffId);
        if (!staff) continue;

        candidates.push({
          staffId: staffSchedule.staffId,
          staffName: `${staff.profile?.firstName || ''} ${staff.profile?.lastName || ''}`.trim() || staff.username,
          confidence,
          reason: proximityScore > 20 ?
            `Available and recently visited nearby property (${Math.round(proximityScore)}% proximity bonus)` :
            'Available for this time slot',
          estimatedTravelTime: availability.estimatedTravelTime,
          previousInspection: availability.previousInspection
        });
      }

      // Sort by confidence (highest first) and return the best candidate
      candidates.sort((a, b) => b.confidence - a.confidence);
      return candidates.length > 0 ? candidates[0] : null;

    } catch (error) {
      console.error('Error finding best staff for inspection:', error);
      return null;
    }
  }

  /**
   * Check if a specific staff member is available for a time slot
   */
  private static async checkStaffAvailability(
    staffSchedule: IStaffSchedule,
    scheduledDate: Date,
    startTime: string,
    endTime: string,
    duration: number
  ): Promise<{
    isAvailable: boolean;
    concurrentSlots: number;
    estimatedTravelTime?: number;
    previousInspection?: StaffAssignmentResult['previousInspection'];
  }> {
    try {
      // Check staff's work schedule for the day
      const daySchedule = await StaffSchedule.getStaffScheduleForDate(
        staffSchedule.staffId.toString(),
        scheduledDate
      );

      if (!daySchedule?.isWorking) {
        return { isAvailable: false, concurrentSlots: 0 };
      }

      // Check if the requested time is within working hours
      if (daySchedule.startTime && daySchedule.endTime) {
        if (startTime < daySchedule.startTime || endTime > daySchedule.endTime) {
          return { isAvailable: false, concurrentSlots: 0 };
        }
      }

      // Check for conflicting inspections
      const conflictingInspections = await Inspection.find({
        assignedStaffId: staffSchedule.staffId,
        scheduledDate,
        status: { $in: ['scheduled', 'in_progress'] },
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      });

      const concurrentSlots = conflictingInspections.length;

      // Check if staff can handle more concurrent inspections
      if (concurrentSlots >= staffSchedule.maxConcurrentInspections) {
        return { isAvailable: false, concurrentSlots };
      }

      // Calculate estimated travel time if there are existing inspections
      let estimatedTravelTime: number | undefined;
      let previousInspection: StaffAssignmentResult['previousInspection'] | undefined;

      if (conflictingInspections.length > 0) {
        // Find the most recent inspection that ends before this one
        const sortedInspections = conflictingInspections.sort(
          (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
        );

        for (const inspection of sortedInspections) {
          if (new Date(inspection.endTime) < new Date(scheduledDate.toDateString() + ' ' + startTime)) {
            // This inspection ends before the new one starts
            if (inspection.propertyLocation?.latitude && inspection.propertyLocation?.longitude &&
                staffSchedule.workArea?.center?.latitude && staffSchedule.workArea?.center?.longitude) {

              estimatedTravelTime = calculateDistance(
                inspection.propertyLocation.latitude,
                inspection.propertyLocation.longitude,
                staffSchedule.workArea.center.latitude,
                staffSchedule.workArea.center.longitude
              ) * 60; // Convert to minutes (assuming average speed)

              previousInspection = {
                propertyId: inspection.propertyId,
                endTime: new Date(scheduledDate.toDateString() + ' ' + inspection.endTime),
                distance: estimatedTravelTime / 60 // Convert back to km for display
              };
            }
            break;
          }
        }
      }

      return {
        isAvailable: true,
        concurrentSlots,
        estimatedTravelTime,
        previousInspection
      };

    } catch (error) {
      console.error('Error checking staff availability:', error);
      return { isAvailable: false, concurrentSlots: 0 };
    }
  }

  /**
   * Calculate proximity score based on recent nearby inspections
   */
  private static async calculateProximityScore(
    staffId: mongoose.Types.ObjectId,
    property: IProperty,
    scheduledDate: Date,
    startTime: string
  ): Promise<number> {
    try {
      // Look for inspections by this staff in the last 4 hours (2 hours buffer)
      const fourHoursAgo = new Date(scheduledDate.getTime() - 4 * 60 * 60 * 1000);
      const twoHoursFromNow = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000);

      const recentInspections = await Inspection.find({
        assignedStaffId: staffId,
        scheduledDate: { $gte: fourHoursAgo, $lte: twoHoursFromNow },
        status: { $in: ['scheduled', 'in_progress', 'completed'] }
      }).populate('propertyId');

      let maxProximityScore = 0;

      for (const inspection of recentInspections) {
        if (inspection.propertyId && (inspection.propertyId as any).location) {
          // Access the populated property data correctly
          const populatedProperty = inspection.propertyId as any;
          if (populatedProperty.location?.latitude && populatedProperty.location?.longitude) {
            const distance = calculateDistance(
              populatedProperty.location.latitude,
              populatedProperty.location.longitude,
              property.location.latitude || 0,
              property.location.longitude || 0
            );

            // If properties are within 10km and inspection is within 2 hours, give high score
            if (distance <= 10) {
              const timeDiff = Math.abs(
                new Date(scheduledDate.toDateString() + ' ' + startTime).getTime() -
                new Date(scheduledDate.toDateString() + ' ' + inspection.endTime).getTime()
              );
              const hoursDiff = timeDiff / (1000 * 60 * 60);

              if (hoursDiff <= 2) {
                // Closer distance and shorter time difference = higher score
                const distanceScore = Math.max(0, 50 - distance * 5); // 50 points max, -5 per km
                const timeScore = Math.max(0, 30 - hoursDiff * 15); // 30 points max, -15 per hour
                const proximityScore = distanceScore + timeScore;

                maxProximityScore = Math.max(maxProximityScore, proximityScore);
              }
            }
          }
        }
      }

      return Math.min(maxProximityScore, 50); // Cap at 50 points

    } catch (error) {
      console.error('Error calculating proximity score:', error);
      return 0;
    }
  }

  /**
   * Get round-robin staff assignment (fallback method)
   */
  static async getRoundRobinStaff(
    organizationId: string,
    excludeStaffId?: mongoose.Types.ObjectId
  ): Promise<IUser | null> {
    try {
      // Get all active staff
      const activeStaff = await StaffSchedule.findActiveStaff(organizationId);

      if (activeStaff.length === 0) return null;

      // Filter out excluded staff
      const availableStaff = excludeStaffId
        ? activeStaff.filter((staff: IStaffSchedule) => !staff.staffId.equals(excludeStaffId))
        : activeStaff;

      if (availableStaff.length === 0) return null;

      // Get the staff member with the least recent assignment
      const staffIds = availableStaff.map((s: IStaffSchedule) => s.staffId);

      // Find the most recent inspection for each staff member
      const recentInspections = await Inspection.aggregate([
        {
          $match: {
            assignedStaffId: { $in: staffIds },
            status: { $in: ['scheduled', 'in_progress', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$assignedStaffId',
            lastInspectionDate: { $max: '$scheduledDate' }
          }
        }
      ]);

      // Find staff with no recent inspections (new staff) or oldest inspection
      let selectedStaffId = staffIds[0]; // Default to first
      let oldestDate = new Date();

      for (const staff of availableStaff) {
        const recentInspection = recentInspections.find(
          ri => ri._id.equals(staff.staffId)
        );

        if (!recentInspection) {
          // Staff with no recent inspections gets priority
          selectedStaffId = staff.staffId;
          break;
        } else if (recentInspection.lastInspectionDate < oldestDate) {
          // Staff with oldest inspection gets next priority
          oldestDate = recentInspection.lastInspectionDate;
          selectedStaffId = staff.staffId;
        }
      }

      return await User.findById(selectedStaffId);

    } catch (error) {
      console.error('Error getting round-robin staff:', error);
      return null;
    }
  }

  /**
   * Check overall availability and suggest alternatives
   */
  static async checkAvailabilityAndSuggestAlternatives(
    organizationId: string,
    property: IProperty,
    requestedDate: Date,
    preferredStartTime: string,
    duration: number
  ): Promise<AvailabilityCheckResult> {
    const result: AvailabilityCheckResult = {
      isAvailable: false,
      availableStaff: [],
      suggestedAlternatives: []
    };

    try {
      // Check if staff is available for the preferred time
      const preferredEndTime = addMinutesToTime(preferredStartTime, duration);
      const bestStaff = await this.findBestStaffForInspection(
        organizationId,
        property,
        requestedDate,
        preferredStartTime,
        preferredEndTime,
        duration
      );

      if (bestStaff) {
        result.isAvailable = true;
        result.availableStaff = [bestStaff];
      }

      // If not available, suggest alternative time slots for the same day
      if (!result.isAvailable) {
        result.suggestedAlternatives = await this.suggestAlternativeTimeSlots(
          organizationId,
          property,
          requestedDate,
          duration
        );
      }

      // Also suggest nearby dates if same day is not available
      if (result.suggestedAlternatives.length === 0) {
        const nearbyDates = await this.suggestNearbyDates(
          organizationId,
          property,
          requestedDate,
          duration
        );
        result.suggestedAlternatives.push(...nearbyDates);
      }

      return result;

    } catch (error) {
      console.error('Error checking availability:', error);
      return result;
    }
  }

  /**
   * Suggest alternative time slots for the same day
   */
  private static async suggestAlternativeTimeSlots(
    organizationId: string,
    property: IProperty,
    date: Date,
    duration: number
  ): Promise<AvailabilityCheckResult['suggestedAlternatives']> {
    const alternatives: AvailabilityCheckResult['suggestedAlternatives'] = [];

    try {
      // Generate time slots throughout the day (9 AM to 6 PM)
      const timeSlots = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) { // Every 30 minutes
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endTime = addMinutesToTime(startTime, duration);

          // Don't suggest slots that end after 6 PM
          if (endTime <= '18:00') {
            timeSlots.push({ startTime, endTime });
          }
        }
      }

      // Check availability for each time slot
      for (const slot of timeSlots) {
        const staff = await this.findBestStaffForInspection(
          organizationId,
          property,
          date,
          slot.startTime,
          slot.endTime,
          duration
        );

        if (staff) {
          alternatives.push({
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            reason: `Staff available: ${staff.staffName}`
          });
        }
      }

      // Return top 5 alternatives
      return alternatives.slice(0, 5);

    } catch (error) {
      console.error('Error suggesting alternative time slots:', error);
      return [];
    }
  }

  /**
   * Suggest nearby dates when same day is not available
   */
  private static async suggestNearbyDates(
    organizationId: string,
    property: IProperty,
    originalDate: Date,
    duration: number
  ): Promise<AvailabilityCheckResult['suggestedAlternatives']> {
    const alternatives: AvailabilityCheckResult['suggestedAlternatives'] = [];

    try {
      // Check next 7 days
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(originalDate);
        checkDate.setDate(originalDate.getDate() + i);

        // Skip weekends if needed (you can customize this logic)
        if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
          continue; // Skip Sundays and Saturdays
        }

        const sameDaySlots = await this.suggestAlternativeTimeSlots(
          organizationId,
          property,
          checkDate,
          duration
        );

        if (sameDaySlots.length > 0) {
          alternatives.push(...sameDaySlots.map(slot => ({
            ...slot,
            reason: `${slot.reason} (Next day)`
          })));
        }
      }

      return alternatives.slice(0, 5);

    } catch (error) {
      console.error('Error suggesting nearby dates:', error);
      return [];
    }
  }
}
