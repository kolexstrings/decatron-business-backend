import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeSlot {
  startTime: string; // Format: "HH:mm" (e.g., "09:00")
  endTime: string;   // Format: "HH:mm" (e.g., "17:00")
}

export interface IDaySchedule {
  isAvailable: boolean;
  timeSlots: ITimeSlot[];
}

export interface IAvailability extends Document {
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;

  // Weekly schedule: Monday to Sunday
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;

  // Settings
  timeSlotDuration: number; // in minutes, default 60
  bufferTime: number; // buffer time between slots in minutes

  createdAt: Date;
  updatedAt: Date;
}

const DayScheduleSchema = new Schema({
  isAvailable: { type: Boolean, default: false },
  timeSlots: [{
    startTime: { type: String, required: true }, // "HH:mm" format
    endTime: { type: String, required: true }    // "HH:mm" format
  }]
}, { _id: false });

const AvailabilitySchema: Schema = new Schema({
  organizationId: { type: String, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },

  // Weekly schedule
  monday: { type: DayScheduleSchema, default: () => ({ isAvailable: false, timeSlots: [] }) },
  tuesday: { type: DayScheduleSchema, default: () => ({ isAvailable: false, timeSlots: [] }) },
  wednesday: { type: DayScheduleSchema, default: () => ({ isAvailable: false, timeSlots: [] }) },
  thursday: { type: DayScheduleSchema, default: () => ({ isAvailable: false, timeSlots: [] }) },
  friday: { type: DayScheduleSchema, default: () => ({ isAvailable: false, timeSlots: [] }) },
  saturday: { type: DayScheduleSchema, default: () => ({ isAvailable: false, timeSlots: [] }) },
  sunday: { type: DayScheduleSchema, default: () => ({ isAvailable: false, timeSlots: [] }) },

  // Settings
  timeSlotDuration: { type: Number, default: 60 }, // minutes
  bufferTime: { type: Number, default: 0 }, // minutes between slots

}, {
  timestamps: true,
});

// Helper method to get schedule for a specific day
AvailabilitySchema.methods.getDaySchedule = function(dayOfWeek: string): IDaySchedule {
  return this[dayOfWeek.toLowerCase()] || { isAvailable: false, timeSlots: [] };
};

// Helper method to set schedule for a specific day
AvailabilitySchema.methods.setDaySchedule = function(dayOfWeek: string, schedule: IDaySchedule) {
  this[dayOfWeek.toLowerCase()] = schedule;
};

// Static method to find availabilities by organization
AvailabilitySchema.statics.findByOrganization = function(organizationId: string) {
  return this.find({ organizationId, isActive: true });
};

// Static method to find availability by ID and organization
AvailabilitySchema.statics.findByIdAndOrganization = function(id: string, organizationId: string) {
  return this.findOne({ _id: id, organizationId, isActive: true });
};

export const Availability = mongoose.model<IAvailability>('Availability', AvailabilitySchema);

// Model helper functions
export const AvailabilityModel = {
  async create(availabilityData: Omit<IAvailability, keyof Document | 'createdAt' | 'updatedAt'>): Promise<IAvailability> {
    const availability = new Availability(availabilityData);
    return await availability.save();
  },

  async findByOrganization(organizationId: string): Promise<IAvailability[]> {
    return await Availability.find({ organizationId, isActive: true });
  },

  async findById(id: string): Promise<IAvailability | null> {
    return await Availability.findById(id);
  },

  async findByIdAndOrganization(id: string, organizationId: string): Promise<IAvailability | null> {
    return await Availability.findOne({ _id: id, organizationId, isActive: true });
  },

  async updateById(id: string, updateData: Partial<IAvailability>): Promise<IAvailability | null> {
    return await Availability.findByIdAndUpdate(id, updateData, { new: true });
  },

  async deleteById(id: string): Promise<boolean> {
    const result = await Availability.findByIdAndDelete(id);
    return !!result;
  }
};
