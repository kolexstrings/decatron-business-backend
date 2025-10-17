import mongoose, { Schema, Document } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'failed';

export interface IBooking extends Document {
  organizationId: string;

  // Property Information
  propertyId: mongoose.Types.ObjectId;
  propertyTitle: string;

  // Client Information
  clientId?: mongoose.Types.ObjectId; // Optional for guest bookings
  clientName: string;
  clientEmail: string;
  clientPhone: string;

  // Requested Time Slot
  requestedDate: Date;
  preferredTimeSlot: {
    startTime: string; // Format: "HH:mm"
    endTime: string;   // Format: "HH:mm"
  };

  // Alternative time slots suggested by system
  suggestedAlternatives?: Array<{
    date: Date;
    startTime: string;
    endTime: string;
    reason: string; // e.g., "Staff available", "Nearby location"
  }>;

  // Assignment Information
  assignedStaffId?: mongoose.Types.ObjectId;
  assignedInspectionId?: mongoose.Types.ObjectId;

  // Status and processing
  status: BookingStatus;
  statusMessage?: string;
  processingAttempts: number;

  // Booking metadata
  source: 'web' | 'whatsapp' | 'walk_in' | 'proxy';
  priority: 'normal' | 'urgent' | 'vip';

  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // For pending bookings that need confirmation
}

const BookingSchema: Schema = new Schema(
  {
    organizationId: { type: String, ref: 'Organization', required: true },

    // Property Information
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    propertyTitle: { type: String, required: true },

    // Client Information
    clientId: { type: Schema.Types.ObjectId, ref: 'User' },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },

    // Requested Time Slot
    requestedDate: { type: Date, required: true },
    preferredTimeSlot: {
      startTime: { type: String, required: true }, // Format: "HH:mm"
      endTime: { type: String, required: true },   // Format: "HH:mm"
    },

    // Alternative time slots suggested by system
    suggestedAlternatives: [{
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      reason: { type: String, required: true },
    }],

    // Assignment Information
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedInspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection' },

    // Status and processing
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'failed'],
      default: 'pending',
    },
    statusMessage: { type: String },
    processingAttempts: { type: Number, default: 0 },

    // Booking metadata
    source: {
      type: String,
      enum: ['web', 'whatsapp', 'walk_in', 'proxy'],
      default: 'web',
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'vip'],
      default: 'normal',
    },

    expiresAt: { type: Date }, // For pending bookings that need confirmation
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
BookingSchema.index({ organizationId: 1, requestedDate: 1 });
BookingSchema.index({ propertyId: 1 });
BookingSchema.index({ clientEmail: 1 });
BookingSchema.index({ status: 1, expiresAt: 1 });
BookingSchema.index({ assignedStaffId: 1 });

// TTL index for auto-expiring pending bookings (24 hours)
BookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods for common queries
BookingSchema.statics.findByOrganization = function (organizationId: string) {
  return this.find({ organizationId });
};

BookingSchema.statics.findPendingBookings = function (organizationId?: string) {
  const query: any = { status: 'pending' };
  if (organizationId) query.organizationId = organizationId;
  return this.find(query).sort({ createdAt: 1 });
};

BookingSchema.statics.findExpiredBookings = function () {
  return this.find({
    status: 'pending',
    expiresAt: { $lt: new Date() }
  });
};

BookingSchema.statics.findByProperty = function (propertyId: string) {
  return this.find({ propertyId });
};

BookingSchema.statics.findByClient = function (clientEmail: string) {
  return this.find({ clientEmail });
};

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
