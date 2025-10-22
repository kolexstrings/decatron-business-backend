import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationUpdate extends Document {
  inspectionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Staff member or client
  userType: 'staff' | 'client';
  organizationId: string;

  // Location data
  latitude: number;
  longitude: number;
  accuracy?: number; // GPS accuracy in meters
  altitude?: number;
  speed?: number; // Speed in km/h
  heading?: number; // Direction in degrees

  // Context
  timestamp: Date;
  isRealTime: boolean;

  // Additional context
  status?: 'traveling_to_property' | 'at_property' | 'traveling_to_office' | 'inspection_in_progress' | 'completed';
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LocationUpdateSchema: Schema = new Schema(
  {
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userType: {
      type: String,
      enum: ['staff', 'client'],
      required: true
    },
    organizationId: { type: String, ref: 'Organization', required: true },

    // Location data
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number, min: 0 }, // GPS accuracy in meters
    altitude: { type: Number },
    speed: { type: Number, min: 0 }, // Speed in km/h
    heading: { type: Number, min: 0, max: 360 }, // Direction in degrees

    // Context
    timestamp: { type: Date, default: Date.now, required: true },
    isRealTime: { type: Boolean, default: true },

    // Additional context
    status: {
      type: String,
      enum: ['traveling_to_property', 'at_property', 'traveling_to_office', 'inspection_in_progress', 'completed']
    },
    notes: { type: String },
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
LocationUpdateSchema.index({ inspectionId: 1, userType: 1 });
LocationUpdateSchema.index({ userId: 1, timestamp: -1 });
LocationUpdateSchema.index({ organizationId: 1, timestamp: -1 });
LocationUpdateSchema.index({ latitude: 1, longitude: 1 }); // For geospatial queries

// Static methods
LocationUpdateSchema.statics.findByInspection = function (inspectionId: string) {
  return this.find({ inspectionId }).sort({ timestamp: 1 });
};

LocationUpdateSchema.statics.findByUserAndInspection = function (userId: string, inspectionId: string) {
  return this.find({ userId, inspectionId }).sort({ timestamp: 1 });
};

LocationUpdateSchema.statics.findLatestByInspection = function (inspectionId: string, userType?: string) {
  const query: any = { inspectionId };
  if (userType) query.userType = userType;
  return this.find(query).sort({ timestamp: -1 }).limit(1);
};

LocationUpdateSchema.statics.getInspectionRoute = function (inspectionId: string, userType?: string) {
  const query: any = { inspectionId, isRealTime: true };
  if (userType) query.userType = userType;
  return this.find(query).sort({ timestamp: 1 });
};

export const LocationUpdate = mongoose.model<ILocationUpdate>('LocationUpdate', LocationUpdateSchema);
