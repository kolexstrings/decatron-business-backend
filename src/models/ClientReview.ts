import mongoose, { Schema, Document } from 'mongoose';

export interface IClientReview extends Document {
  organizationId: string;

  // Inspection reference
  inspectionId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;

  // Staff being reviewed
  staffId: mongoose.Types.ObjectId;
  staffName: string;

  // Overall experience rating (1-5 stars)
  overallRating: 1 | 2 | 3 | 4 | 5;

  // Specific ratings for different aspects
  agentKnowledge: 1 | 2 | 3 | 4 | 5;
  communication: 1 | 2 | 3 | 4 | 5;
  professionalism: 1 | 2 | 3 | 4 | 5;
  punctuality: 1 | 2 | 3 | 4 | 5;

  // Review content
  reviewText?: string;
  pros?: string[];
  cons?: string[];

  // Would recommend (Yes/No)
  wouldRecommend: boolean;

  // Improvement suggestions (optional)
  suggestions?: string;

  // Review helpfulness (for future feature)
  helpfulVotes: number;
  totalVotes: number;

  // Review status
  isVerified: boolean; // Verified as actual client
  isPublic: boolean; // Can be shown publicly

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const ClientReviewSchema: Schema = new Schema({
  organizationId: { type: String, ref: 'Organization', required: true },

  // Inspection reference
  inspectionId: { type: Schema.Types.ObjectId, ref: 'Inspection', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'User' },

  // Staff being reviewed
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  staffName: { type: String, required: true },

  // Overall experience rating (1-5 stars)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },

  // Specific ratings for different aspects
  agentKnowledge: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },
  communication: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },
  professionalism: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },
  punctuality: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    enum: [1, 2, 3, 4, 5]
  },

  // Review content
  reviewText: { type: String },
  pros: [{ type: String }],
  cons: [{ type: String }],

  // Would recommend (Yes/No)
  wouldRecommend: { type: Boolean, required: true },

  // Improvement suggestions (optional)
  suggestions: { type: String },

  // Review helpfulness (for future feature)
  helpfulVotes: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },

  // Review status
  isVerified: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },

  // Metadata
}, {
  timestamps: true,
});

// Indexes for efficient queries
ClientReviewSchema.index({ organizationId: 1, inspectionId: 1 }, { unique: true });
ClientReviewSchema.index({ organizationId: 1, staffId: 1 });
ClientReviewSchema.index({ organizationId: 1, overallRating: 1 });
ClientReviewSchema.index({ organizationId: 1, isPublic: 1 });
ClientReviewSchema.index({ staffId: 1, overallRating: 1 });
ClientReviewSchema.index({ clientId: 1 });

// Static methods for common queries
ClientReviewSchema.statics.findByOrganization = function (organizationId: string, isPublic?: boolean) {
  const query: any = { organizationId };
  if (isPublic !== undefined) query.isPublic = isPublic;
  return this.find(query).sort({ createdAt: -1 });
};

ClientReviewSchema.statics.findByStaff = function (staffId: string, organizationId?: string) {
  const query: any = { staffId };
  if (organizationId) query.organizationId = organizationId;
  return this.find(query).sort({ createdAt: -1 });
};

ClientReviewSchema.statics.findByClient = function (clientId: string) {
  return this.find({ clientId }).sort({ createdAt: -1 });
};

ClientReviewSchema.statics.findByInspection = function (inspectionId: string) {
  return this.findOne({ inspectionId });
};

ClientReviewSchema.statics.getStaffAverageRating = function (staffId: string, organizationId?: string) {
  const matchQuery: any = { staffId };
  if (organizationId) matchQuery.organizationId = organizationId;

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$staffId',
        averageOverall: { $avg: '$overallRating' },
        averageKnowledge: { $avg: '$agentKnowledge' },
        averageCommunication: { $avg: '$communication' },
        averageProfessionalism: { $avg: '$professionalism' },
        averagePunctuality: { $avg: '$punctuality' },
        totalReviews: { $sum: 1 },
        recommendationRate: {
          $avg: { $cond: ['$wouldRecommend', 1, 0] }
        }
      }
    }
  ]);
};

ClientReviewSchema.statics.getOrganizationStats = function (organizationId: string) {
  return this.aggregate([
    { $match: { organizationId, isPublic: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$overallRating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$overallRating'
        },
        recommendationRate: {
          $avg: { $cond: ['$wouldRecommend', 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: 1,
        totalReviews: 1,
        recommendationRate: 1,
        ratingDistribution: {
          1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } },
          2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } }
        }
      }
    }
  ]);
};

export const ClientReview = mongoose.model<IClientReview>('ClientReview', ClientReviewSchema);
