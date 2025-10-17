import mongoose, { Schema, Document } from 'mongoose';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface IWorkSchedule {
  dayOfWeek: DayOfWeek;
  isWorking: boolean;
  startTime?: string; // Format: "HH:mm"
  endTime?: string;   // Format: "HH:mm"
  breakStart?: string; // Format: "HH:mm"
  breakEnd?: string;   // Format: "HH:mm"
  maxInspections?: number; // Maximum inspections per day
}

export interface ISpecialDate {
  date: Date;
  isWorking: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface IWorkArea {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

export interface IStaffSchedule extends Document {
  organizationId: string;
  staffId: mongoose.Types.ObjectId;
  staffName: string;

  // Work schedule for each day of the week
  weeklySchedule: IWorkSchedule[];

  // Special dates (overrides weekly schedule)
  specialDates: ISpecialDate[];

  // Availability settings
  isActive: boolean; // Whether this staff member is accepting new bookings
  maxConcurrentInspections: number; // Maximum inspections at the same time
  preferredInspectionDuration: number; // Default duration in minutes
  maxTravelTime: number; // Maximum travel time between inspections in minutes

  // Geographic work area
  workArea?: IWorkArea;

  // Performance metrics
  totalInspections: number;
  completedInspections: number;
  cancelledInspections: number;
  averageRating?: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
export interface IStaffScheduleModel extends mongoose.Model<IStaffSchedule> {
  findActiveStaff(organizationId: string): Promise<IStaffSchedule[]>;
  findStaffByWorkArea(latitude: number, longitude: number, maxDistance?: number): Promise<IStaffSchedule[]>;
  findAvailableStaffForTimeSlot(
    organizationId: string,
    date: Date,
    startTime: string,
    endTime: string,
    requiredDuration: number
  ): Promise<IStaffSchedule[]>;
  getStaffScheduleForDate(staffId: string, date: Date): Promise<IWorkSchedule | ISpecialDate | null>;
  updatePerformanceMetrics(staffId: string, inspectionStatus: string): Promise<IStaffSchedule | null>;
}

const WorkScheduleSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isWorking: { type: Boolean, default: true },
    startTime: { type: String }, // Format: "HH:mm"
    endTime: { type: String },   // Format: "HH:mm"
    breakStart: { type: String }, // Format: "HH:mm"
    breakEnd: { type: String },   // Format: "HH:mm"
    maxInspections: { type: Number, min: 1, max: 20 },
  },
  { _id: false }
);

const SpecialDateSchema = new Schema(
  {
    date: { type: Date, required: true },
    isWorking: { type: Boolean, required: true },
    startTime: { type: String },
    endTime: { type: String },
    reason: { type: String },
  },
  { _id: false }
);

const WorkAreaSchema = new Schema(
  {
    center: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    radius: { type: Number, required: true, min: 1, max: 200 }, // 1-200 km
  },
  { _id: false }
);

const StaffScheduleSchema: Schema = new Schema(
  {
    organizationId: { type: String, ref: 'Organization', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    staffName: { type: String, required: true },

    // Work schedule for each day of the week
    weeklySchedule: {
      type: [WorkScheduleSchema],
      required: true,
      validate: {
        validator: function (schedule: IWorkSchedule[]) {
          // Ensure all 7 days are represented
          const days = schedule.map(s => s.dayOfWeek);
          return days.length === 7 && days.every(day => day >= 0 && day <= 6);
        },
        message: 'Weekly schedule must include all 7 days of the week'
      }
    },

    // Special dates (overrides weekly schedule)
    specialDates: [SpecialDateSchema],

    // Availability settings
    isActive: { type: Boolean, default: true },
    maxConcurrentInspections: { type: Number, default: 1, min: 1, max: 5 },
    preferredInspectionDuration: { type: Number, default: 60, min: 15, max: 240 },
    maxTravelTime: { type: Number, default: 120, min: 15, max: 480 }, // 15 min to 8 hours

    // Geographic work area
    workArea: WorkAreaSchema,

    // Performance metrics
    totalInspections: { type: Number, default: 0, min: 0 },
    completedInspections: { type: Number, default: 0, min: 0 },
    cancelledInspections: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, min: 1, max: 5 },

  },
  {
    timestamps: true
  }
);

// Static methods for common queries
StaffScheduleSchema.statics.findActiveStaff = function (organizationId: string) {
  return this.find({ organizationId, isActive: true });
};

StaffScheduleSchema.statics.findStaffByWorkArea = function (latitude: number, longitude: number, maxDistance?: number) {
  const query: any = {
    'workArea.center': {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: maxDistance || 50000 // 50km default
      }
    }
  };
  return this.find(query);
};

StaffScheduleSchema.statics.findAvailableStaffForTimeSlot = function (
  organizationId: string,
  date: Date,
  startTime: string,
  endTime: string,
  requiredDuration: number
) {
  // This will be implemented in the service layer with complex availability logic
  return this.find({
    organizationId,
    isActive: true,
    // Additional filtering will be done in service layer
  });
};

StaffScheduleSchema.statics.getStaffScheduleForDate = function (staffId: string, date: Date) {
  return (this as any).findOne({ staffId }).then((schedule: IStaffSchedule | null) => {
    if (!schedule) return null;

    // Check for special dates first
    const specialDate = schedule.specialDates.find(
      (sd: any) => sd.date.toDateString() === date.toDateString()
    );

    if (specialDate) {
      return specialDate;
    }

    // Return weekly schedule for the day
    const dayOfWeek = date.getDay();
    return schedule.weeklySchedule.find((ws: any) => ws.dayOfWeek === dayOfWeek);
  });
};

StaffScheduleSchema.statics.updatePerformanceMetrics = function (staffId: string, inspectionStatus: string) {
  const update: any = {};

  if (inspectionStatus === 'completed') {
    update.$inc = {
      totalInspections: 1,
      completedInspections: 1
    };
  } else if (inspectionStatus === 'cancelled') {
    update.$inc = {
      totalInspections: 1,
      cancelledInspections: 1
    };
  }

  return this.findOneAndUpdate({ staffId }, update, { new: true });
};

export const StaffSchedule = mongoose.model<IStaffSchedule, IStaffScheduleModel>('StaffSchedule', StaffScheduleSchema);
