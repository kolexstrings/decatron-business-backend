import mongoose, { Schema, Document } from 'mongoose';

export type TimeSlotStatus = 'available' | 'booked' | 'blocked' | 'unavailable';

export interface ITimeSlot extends Document {
  organizationId: string;

  // Time slot definition
  date: Date;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  duration: number;  // Duration in minutes

  // Staff assignment and availability
  assignedStaffId?: mongoose.Types.ObjectId;
  isStaffAvailable: boolean;

  // Booking information
  bookingId?: mongoose.Types.ObjectId;
  inspectionId?: mongoose.Types.ObjectId;

  // Status and metadata
  status: TimeSlotStatus;
  maxBookings: number; // Maximum inspections that can be scheduled in this slot
  currentBookings: number;

  // Recurring slot information
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    endDate?: Date;
  };

  // Business logic fields
  priority: number; // For sorting available slots (higher = more preferred)
  demandScore?: number; // Calculated based on booking frequency

  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema: Schema = new Schema(
  {
    organizationId: { type: String, ref: 'Organization', required: true },

    // Time slot definition
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // Format: "HH:mm"
    endTime: { type: String, required: true },   // Format: "HH:mm"
    duration: { type: Number, required: true, min: 15, max: 480 }, // 15 min to 8 hours

    // Staff assignment and availability
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    isStaffAvailable: { type: Boolean, default: true },

    // Booking information
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection' },

    // Status and metadata
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked', 'unavailable'],
      default: 'available',
    },
    maxBookings: { type: Number, default: 1, min: 1, max: 10 },
    currentBookings: { type: Number, default: 0, min: 0 },

    // Recurring slot information
    isRecurring: { type: Boolean, default: false },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0-6, Sunday = 0
      endDate: { type: Date },
    },

    // Business logic fields
    priority: { type: Number, default: 1, min: 1, max: 10 },
    demandScore: { type: Number, default: 0, min: 0 },

  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TimeSlotSchema.index({ organizationId: 1, date: 1 });
TimeSlotSchema.index({ organizationId: 1, status: 1 });
TimeSlotSchema.index({ assignedStaffId: 1, date: 1 });
TimeSlotSchema.index({ date: 1, startTime: 1 });
TimeSlotSchema.index({ status: 1, isStaffAvailable: 1 });

// Compound index for finding available slots
TimeSlotSchema.index({
  organizationId: 1,
  date: 1,
  status: 1,
  isStaffAvailable: 1,
  currentBookings: 1
});

// Static methods for common queries
TimeSlotSchema.statics.findAvailableSlots = function (
  organizationId: string,
  date?: Date,
  startTime?: string,
  endTime?: string
) {
  const query: any = {
    organizationId,
    status: 'available',
    isStaffAvailable: true,
    currentBookings: { $lt: '$maxBookings' }
  };

  if (date) {
    query.date = date;
  }

  if (startTime || endTime) {
    query.$or = [];
    if (startTime) query.$or.push({ startTime: { $gte: startTime } });
    if (endTime) query.$or.push({ endTime: { $lte: endTime } });
  }

  return this.find(query).sort({ date: 1, startTime: 1, priority: -1 });
};

TimeSlotSchema.statics.findByStaff = function (staffId: string, startDate?: Date, endDate?: Date) {
  const query: any = { assignedStaffId: staffId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  return this.find(query).sort({ date: 1, startTime: 1 });
};

TimeSlotSchema.statics.findConflictingSlots = function (
  staffId: string,
  date: Date,
  startTime: string,
  endTime: string
) {
  return this.find({
    assignedStaffId: staffId,
    date,
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  });
};

TimeSlotSchema.statics.getAvailableSlotsForDateRange = function (
  organizationId: string,
  startDate: Date,
  endDate: Date,
  minDuration?: number
) {
  const query: any = {
    organizationId,
    date: { $gte: startDate, $lte: endDate },
    status: 'available',
    isStaffAvailable: true,
  };

  if (minDuration) {
    query.duration = { $gte: minDuration };
  }

  return this.find(query)
    .sort({ date: 1, startTime: 1, priority: -1 })
    .populate('assignedStaffId', 'profile.firstName profile.lastName');
};

export const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot', TimeSlotSchema);
