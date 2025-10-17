import mongoose, { Schema, Document } from 'mongoose';

// Import geocoding service (will be created)
import { GeocodingService, GeocodingResult, GeocodingError } from '../services/geocodingService';

// Type guard function to check if result is GeocodingResult
function isGeocodingResult(result: GeocodingResult | GeocodingError): result is GeocodingResult {
  return 'latitude' in result && 'longitude' in result && !('error' in result);
}

// Type guard function to check if result is GeocodingError
function isGeocodingError(result: GeocodingResult | GeocodingError): result is GeocodingError {
  return 'error' in result;
}

export type PaymentPlanType = 'outright' | 'installment' | 'mortgage' | 'rent_to_own';
export type SaleType = 'House' | 'Apartment' | 'Land';
export type PropertyStatus = 'Available' | 'Sold' | 'Under Construction';

export interface IPaymentSchedule {
  deposit_amount?: number; // Initial deposit
  monthly_payment?: number; // Monthly installment
  duration_months?: number; // Payment duration
  interest_rate?: number; // Annual interest rate (for financed plans)
  total_amount?: number; // Total amount including interest
}

export interface IPaymentPlan {
  type: PaymentPlanType;
  name: string; // e.g., "6-Month Installment", "Mortgage Plan"
  description?: string;
  schedule: IPaymentSchedule;
  is_active: boolean;
  created_at: Date;
}

export interface ILocation {
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface IProperty extends Document {
  organizationId: string;

  // Basic Information
  title: string;
  development_name: string; // Project or estate name
  property_code: string; // Unique internal reference

  // Property Details
  floor?: string; // Optional
  available_units: number;
  sale_type: SaleType;
  price: number; // Default or starting price
  area?: number; // in sqm

  // Room Counts
  bedrooms: number;
  bathrooms: number;
  garage: number;
  kitchen: number;

  // Location
  location: ILocation;

  // Additional Information
  description: string;
  images: string[]; // Array of image URLs

  // Payment Plans
  payment_plans: IPaymentPlan[]; // Multiple payment options

  // Status
  status: PropertyStatus;

  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const PaymentScheduleSchema = new Schema(
  {
    deposit_amount: { type: Number, min: 0 },
    monthly_payment: { type: Number, min: 0 },
    duration_months: { type: Number, min: 1 },
    interest_rate: { type: Number, min: 0, max: 100 },
    total_amount: { type: Number, min: 0 },
  },
  { _id: false }
);

const PaymentPlanSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['outright', 'installment', 'mortgage', 'rent_to_own'],
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    schedule: { type: PaymentScheduleSchema, required: true },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PropertySchema: Schema = new Schema(
  {
    organizationId: { type: String, ref: 'Organization', required: true },

    // Basic Information
    title: { type: String, required: true },
    development_name: { type: String, required: true },
    property_code: { type: String, required: true, unique: true },

    // Property Details
    floor: { type: String },
    available_units: { type: Number, required: true, min: 0 },
    sale_type: {
      type: String,
      enum: ['House', 'Apartment', 'Land'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    area: { type: Number, min: 0 },

    // Room Counts
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    garage: { type: Number, required: true, min: 0 },
    kitchen: { type: Number, required: true, min: 0 },

    // Location
    location: { type: LocationSchema, required: true },

    // Additional Information
    description: { type: String, required: true },
    images: [{ type: String }], // Array of image URLs

    // Payment Plans
    payment_plans: [PaymentPlanSchema], // Multiple payment options

    // Status
    status: {
      type: String,
      enum: ['Available', 'Sold', 'Under Construction'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to geocode addresses
PropertySchema.pre('save', async function (next) {
  try {
    // Cast 'this' to IProperty to access typed properties
    const property = this.toObject() as unknown as IProperty;

    // Only geocode if latitude/longitude are not already set
    if (!property.location.latitude || !property.location.longitude) {
      const geocodingResult = await GeocodingService.geocodeAddress(
        property.location.address,
        property.location.city,
        property.location.state
      );

      // Handle successful geocoding result
      if (geocodingResult && typeof geocodingResult === 'object' && 'latitude' in geocodingResult && 'longitude' in geocodingResult) {
        // @ts-ignore - TypeScript can't properly infer the discriminated union type
        this.location.latitude = geocodingResult.latitude;
        // @ts-ignore - TypeScript can't properly infer the discriminated union type
        this.location.longitude = geocodingResult.longitude;
      }
      // Handle geocoding error
      else if (geocodingResult && typeof geocodingResult === 'object' && 'error' in geocodingResult) {
        // @ts-ignore - TypeScript can't properly infer the discriminated union type
        console.warn(`Geocoding failed for property ${property.title}:`, geocodingResult.message || 'Unknown error');
      }
    }

    next();
  } catch (error) {
    console.error('Error in property geocoding pre-save hook:', error);
    next(error as Error);
  }
});

// Indexes for efficient queries
PropertySchema.index({ organizationId: 1, status: 1 });
PropertySchema.index({ 'location.city': 1, 'location.state': 1 });
PropertySchema.index({ sale_type: 1, price: 1 });

// Static method to find properties by organization
PropertySchema.statics.findByOrganization = function (organizationId: string) {
  return this.find({ organizationId });
};

// Static method to find available properties by organization
PropertySchema.statics.findAvailableByOrganization = function (organizationId: string) {
  return this.find({ organizationId, status: 'Available' });
};

// Static method to find property by ID and organization
PropertySchema.statics.findByIdAndOrganization = function (id: string, organizationId: string) {
  return this.findOne({ _id: id, organizationId });
};

// Static method to search properties by location
PropertySchema.statics.findByLocation = function (city?: string, state?: string) {
  const query: any = {};
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (state) query['location.state'] = new RegExp(state, 'i');
  return this.find(query);
};

export const Property = mongoose.model<IProperty>('Property', PropertySchema);

// Model helper functions
export const PropertyModel = {
  async create(
    propertyData: Omit<IProperty, keyof Document | 'createdAt' | 'updatedAt'>
  ): Promise<IProperty> {
    const property = new Property(propertyData);
    return await property.save();
  },

  async findByOrganization(organizationId: string): Promise<IProperty[]> {
    return await Property.find({ organizationId });
  },

  async findAvailableByOrganization(organizationId: string): Promise<IProperty[]> {
    return await Property.find({ organizationId, status: 'Available' });
  },

  async findById(id: string): Promise<IProperty | null> {
    return await Property.findById(id);
  },

  async findByIdAndOrganization(id: string, organizationId: string): Promise<IProperty | null> {
    return await Property.findOne({ _id: id, organizationId });
  },

  async findByLocation(city?: string, state?: string): Promise<IProperty[]> {
    const query: any = {};
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');
    return await Property.find(query);
  },

  async updateById(id: string, updateData: Partial<IProperty>): Promise<IProperty | null> {
    return await Property.findByIdAndUpdate(id, updateData, { new: true });
  },

  async deleteById(id: string): Promise<boolean> {
    const result = await Property.findByIdAndDelete(id);
    return !!result;
  },

  async searchProperties(filters: {
    organizationId?: string;
    city?: string;
    state?: string;
    sale_type?: SaleType;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    status?: PropertyStatus;
  }): Promise<IProperty[]> {
    const query: any = {};

    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.city) query['location.city'] = new RegExp(filters.city, 'i');
    if (filters.state) query['location.state'] = new RegExp(filters.state, 'i');
    if (filters.sale_type) query.sale_type = filters.sale_type;
    if (filters.bedrooms) query.bedrooms = filters.bedrooms;
    if (filters.status) query.status = filters.status;

    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = filters.minPrice;
      if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }

    return await Property.find(query);
  },
};
