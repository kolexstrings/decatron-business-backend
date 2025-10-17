import mongoose, { Schema, Document } from 'mongoose';

export interface IStaffFeedback extends Document {
  organizationId: string;

  // Inspection reference
  inspectionId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;

  // Staff who provided feedback
  staffId: mongoose.Types.ObjectId;
  staffName: string;

  // Purchase likelihood rating (1-5 scale)
  purchaseLikelihood: 1 | 2 | 3 | 4 | 5;

  // Additional feedback (optional)
  notes?: string;

  // Client behavior indicators
  clientInterest: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  clientEngagement: 'poor' | 'fair' | 'good' | 'excellent';
  followUpRequired: boolean;

  // Staff observations
  questionsAsked: number;
  concernsRaised?: string[];
  budgetDiscussed: boolean;
  timelineDiscussed: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const StaffFeedbackSchema: Schema = new Schema({
  organizationId: { type: String, ref: 'Organization', required: true },

  // Inspection reference
  inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User' },

  // Staff who provided feedback
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String, required: true },

  // Purchase likelihood rating (1-5 scale)
  purchaseLikelihood: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },

  // Additional feedback (optional)
  notes: { type: String },

  // Client behavior indicators
  clientInterest: {
    type: String,
    required: true,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high']
  },
  clientEngagement: {
    type: String,
    required: true,
    enum: ['poor', 'fair', 'good', 'excellent']
  },
  followUpRequired: { type: Boolean, default: false },

  // Staff observations
  questionsAsked: { type: Number, default: 0 },
  concernsRaised: [{ type: String }],
  budgetDiscussed: { type: Boolean, default: false },
  timelineDiscussed: { type: Boolean, default: false },

  // Metadata
}, {
  timestamps: true,
});

// Indexes for efficient queries
StaffFeedbackSchema.index({ organizationId: 1, inspectionId: 1 }, { unique: true });
StaffFeedbackSchema.index({ organizationId: 1, staffId: 1 });
StaffFeedbackSchema.index({ organizationId: 1, purchaseLikelihood: 1 });
StaffFeedbackSchema.index({ organizationId: 1, createdAt: 1 });
StaffFeedbackSchema.index({ inspectionId: 1 });

// Static methods for common queries
StaffFeedbackSchema.statics.findByOrganization = function (organizationId: string) {
  return this.find({ organizationId });
};

StaffFeedbackSchema.statics.findByInspection = function (inspectionId: string) {
  return this.findOne({ inspectionId });
};

StaffFeedbackSchema.statics.findByStaff = function (staffId: string, organizationId?: string) {
  const query: any = { staffId };
  if (organizationId) query.organizationId = organizationId;
  return this.find(query).sort({ createdAt: -1 });
};

StaffFeedbackSchema.statics.findByClient = function (clientId: string, organizationId?: string) {
  const query: any = { clientId };
  if (organizationId) query.organizationId = organizationId;
  return this.find(query).sort({ createdAt: -1 });
};

StaffFeedbackSchema.statics.getPurchaseLikelihoodStats = function (organizationId: string, startDate?: Date, endDate?: Date) {
  const matchQuery: any = { organizationId };

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = startDate;
    if (endDate) matchQuery.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$purchaseLikelihood',
        count: { $sum: 1 },
        averageInterest: { $avg: { $cond: [
          { $eq: ['$clientInterest', 'very_high'] }, 5,
          { $eq: ['$clientInterest', 'high'] }, 4,
          { $eq: ['$clientInterest', 'medium'] }, 3,
          { $eq: ['$clientInterest', 'low'] }, 2,
          { $eq: ['$clientInterest', 'very_low'] }, 1,
          3 // default
        ]}}
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

export const StaffFeedback = mongoose.model<IStaffFeedback>('StaffFeedback', StaffFeedbackSchema);
