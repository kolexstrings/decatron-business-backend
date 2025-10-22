import mongoose, { Schema, Document } from 'mongoose';

export type InspectionStatus = 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface IInspection extends Document {
  organizationId: string;

  // Property Information
  propertyId: mongoose.Types.ObjectId;
  propertyTitle: string;
  propertyLocation: {
    address: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };

  // Client Information
  clientId?: mongoose.Types.ObjectId; // Optional for walk-in clients
  clientName: string;
  clientEmail: string;
  clientPhone: string;

  // Staff Assignment
  assignedStaffId: mongoose.Types.ObjectId;
  assignedStaffName: string;

  // Assignment Status Tracking
  assignmentStatus: 'pending' | 'accepted' | 'rejected';
  assignmentResponseAt?: Date;
  assignmentResponseBy?: mongoose.Types.ObjectId; // Staff who responded
  rejectionReason?: string;

  // Timing
  scheduledDate: Date;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  duration: number;  // Duration in minutes

  // Status and Notes
  status: InspectionStatus;
  notes?: string;
  cancellationReason?: string;

  // Location tracking during inspection
  locationTracking: {
    isEnabled: boolean;
    startTime?: Date;
    endTime?: Date;
    totalDistance?: number; // Total distance traveled in km
    averageSpeed?: number; // Average speed in km/h
  };

  createdAt: Date;
  updatedAt: Date;
}

const PropertyLocationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const LocationTrackingSchema = new Schema(
  {
    isEnabled: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    totalDistance: { type: Number, min: 0 },
    averageSpeed: { type: Number, min: 0 },
  },
  { _id: false }
);

const InspectionSchema: Schema = new Schema(
  {
    organizationId: { type: String, ref: 'Organization', required: true },

    // Property Information
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    propertyTitle: { type: String, required: true },
    propertyLocation: PropertyLocationSchema,

    // Client Information
    clientId: { type: Schema.Types.ObjectId, ref: 'User' },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },

    // Staff Assignment
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedStaffName: { type: String, required: true },

    // Assignment Status Tracking
    assignmentStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      required: true
    },
    assignmentResponseAt: { type: Date },
    assignmentResponseBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },

    // Timing
    scheduledDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // Format: "HH:mm"
    endTime: { type: String, required: true },   // Format: "HH:mm"
    duration: { type: Number, required: true, min: 15, max: 480 }, // 15 min to 8 hours

    // Status and Notes
    status: {
      type: String,
      enum: ['assigned', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'assigned',
    },
    notes: { type: String },
    cancellationReason: { type: String },

    // Location tracking during inspection
    locationTracking: LocationTrackingSchema,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
InspectionSchema.index({ organizationId: 1, scheduledDate: 1 });
InspectionSchema.index({ assignedStaffId: 1, scheduledDate: 1 });
InspectionSchema.index({ propertyId: 1 });
InspectionSchema.index({ clientEmail: 1 });
InspectionSchema.index({ status: 1, scheduledDate: 1 });

// Static methods for common queries
InspectionSchema.statics.findByOrganization = function (organizationId: string) {
  return this.find({ organizationId });
};

InspectionSchema.statics.findByStaff = function (staffId: string, startDate?: Date, endDate?: Date) {
  const query: any = { assignedStaffId: staffId };
  if (startDate || endDate) {
    query.scheduledDate = {};
    if (startDate) query.scheduledDate.$gte = startDate;
    if (endDate) query.scheduledDate.$lte = endDate;
  }
  return this.find(query);
};

InspectionSchema.statics.findByProperty = function (propertyId: string) {
  return this.find({ propertyId });
};

InspectionSchema.statics.findByDateRange = function (startDate: Date, endDate: Date, organizationId?: string) {
  const query: any = {
    scheduledDate: { $gte: startDate, $lte: endDate }
  };
  if (organizationId) query.organizationId = organizationId;
  return this.find(query);
};

InspectionSchema.statics.findAvailableStaffForTimeSlot = function (
  organizationId: string,
  scheduledDate: Date,
  startTime: string,
  endTime: string,
  excludeStaffId?: string
) {
  // This will be implemented in the service layer with more complex logic
  return this.find({
    organizationId,
    scheduledDate,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ],
    ...(excludeStaffId && { assignedStaffId: { $ne: excludeStaffId } })
  });
};

export const Inspection = mongoose.model<IInspection>('Inspection', InspectionSchema);
