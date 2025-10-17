import bcrypt from 'bcrypt';
import { OrganizationModel, UserModel } from '../models/User';
import { AvailabilityModel, IAvailability, IDaySchedule } from '../models/Availability';
import { PropertyModel, IProperty, SaleType, PropertyStatus, PaymentPlanType } from '../models/Property';
import { JWTUtils } from '../utils/jwt';
import { OtpUtils } from '../utils/otp';
import { EmailUtils } from '../utils/email';

export class AuthService {
  static async registerOrganization(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    size: '1-10' | '11-50' | '51-200' | '200+';
    category: 'Property Development' | 'Property Management';
  }) {
    const existingOrg = await OrganizationModel.findByEmail(data.email);
    if (existingOrg) {
      throw new Error('Organization with this email already exists');
    }

    const organization = await OrganizationModel.create(data);
    const token = JWTUtils.sign({
      userId: organization.id,
      email: organization.email,
      role: 'organization',
      organizationId: organization.id,
    });

    return { organization, token };
  }

  static async loginOrganization(email: string, password: string) {
    const organization = await OrganizationModel.findByEmail(email);
    if (!organization) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, organization.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = JWTUtils.sign({
      userId: organization.id,
      email: organization.email,
      role: 'organization',
      organizationId: organization.id,
    });

    return { organization, token };
  }

  static async addUser(data: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'agent' | 'staff';
    organizationId: string;
  }) {
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    if (!['admin', 'agent', 'staff'].includes(data.role)) {
      throw new Error('Invalid role');
    }

    const user = await UserModel.create(data);
    return user;
  }

  static async getUsers(organizationId: string) {
    return await UserModel.findByOrganizationId(organizationId);
  }

  static async loginUser(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = JWTUtils.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    return { user, token };
  }

  static async updateUserProfile(userId: string, profile: any) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.profile = { ...user.profile, ...profile };
    await user.save();
    return user;
  }


  static async updateOrganizationProfile(organizationId: string, profile: any) {
    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    organization.profile = { ...organization.profile, ...profile };
    await organization.save();
    return organization;
  }

  static async getOrganization(organizationId: string) {
    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return organization;
  }

  static async generateInvite(data: {
    email: string;
    role: 'admin' | 'agent' | 'staff';
    organizationId: string;
  }) {
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const token = JWTUtils.sign({
      userId: '', // Placeholder for invite
      email: data.email,
      organizationId: data.organizationId,
      role: data.role,
      type: 'invite',
    });

    return token;
  }

  static async registerUserViaInvite(data: { token: string; username: string; password: string }) {
    const decoded = JWTUtils.verify(data.token);
    if (!decoded || decoded.type !== 'invite') {
      throw new Error('Invalid or expired invite link');
    }

    const { email, organizationId, role } = decoded;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = await UserModel.create({
      username: data.username,
      email,
      password: data.password,
      role: role as 'admin' | 'agent' | 'staff',
      organizationId: organizationId!,
    });

    return user;
  }

  static async sendOtp(email: string, purpose: 'registration' | 'invite') {
    return await OtpUtils.generateOtp(email, purpose);
  }

  static async verifyOtp(email: string, otp: string, purpose: 'registration' | 'invite') {
    return await OtpUtils.verifyOtp(email, otp, purpose);
  }

  // Availability management methods
  static async createAvailability(data: {
    organizationId: string;
    name: string;
    description?: string;
    isActive?: boolean;
    monday?: { isAvailable: boolean; timeSlots: Array<{ startTime: string; endTime: string }> };
    tuesday?: { isAvailable: boolean; timeSlots: Array<{ startTime: string; endTime: string }> };
    wednesday?: { isAvailable: boolean; timeSlots: Array<{ startTime: string; endTime: string }> };
    thursday?: { isAvailable: boolean; timeSlots: Array<{ startTime: string; endTime: string }> };
    friday?: { isAvailable: boolean; timeSlots: Array<{ startTime: string; endTime: string }> };
    saturday?: { isAvailable: boolean; timeSlots: Array<{ startTime: string; endTime: string }> };
    sunday?: { isAvailable: boolean; timeSlots: Array<{ startTime: string; endTime: string }> };
    timeSlotDuration?: number;
    bufferTime?: number;
  }) {
    // Set default values for optional fields and day schedules
    const availabilityData = {
      isActive: true,
      timeSlotDuration: 60,
      bufferTime: 0,
      monday: { isAvailable: false, timeSlots: [] },
      tuesday: { isAvailable: false, timeSlots: [] },
      wednesday: { isAvailable: false, timeSlots: [] },
      thursday: { isAvailable: false, timeSlots: [] },
      friday: { isAvailable: false, timeSlots: [] },
      saturday: { isAvailable: false, timeSlots: [] },
      sunday: { isAvailable: false, timeSlots: [] },
      ...data
    };

    const availability = await AvailabilityModel.create(availabilityData);
    return availability;
  }

  static async getOrganizationAvailabilities(organizationId: string) {
    return await AvailabilityModel.findByOrganization(organizationId);
  }

  static async getAvailabilityById(availabilityId: string, organizationId: string) {
    const availability = await AvailabilityModel.findByIdAndOrganization(availabilityId, organizationId);
    if (!availability) {
      throw new Error('Availability not found');
    }
    return availability;
  }

  static async updateAvailability(availabilityId: string, organizationId: string, updateData: any): Promise<IAvailability> {
    const availability = await AvailabilityModel.findByIdAndOrganization(availabilityId, organizationId);
    if (!availability) {
      throw new Error('Availability not found');
    }

    const updatedAvailability = await AvailabilityModel.updateById(availabilityId, updateData);
    if (!updatedAvailability) {
      throw new Error('Failed to update availability');
    }
    return updatedAvailability;
  }

  static async deleteAvailability(availabilityId: string, organizationId: string) {
    const availability = await AvailabilityModel.findByIdAndOrganization(availabilityId, organizationId);
    if (!availability) {
      throw new Error('Availability not found');
    }

    await AvailabilityModel.deleteById(availabilityId);
    return { success: true, message: 'Availability deleted successfully' };
  }

  static async getAvailableTimeSlots(availabilityId: string, organizationId: string, date: Date) {
    const availability = await AvailabilityModel.findByIdAndOrganization(availabilityId, organizationId);
    if (!availability) {
      throw new Error('Availability not found');
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const daySchedule = (availability as any)[dayName] as IDaySchedule;

    if (!daySchedule.isAvailable || daySchedule.timeSlots.length === 0) {
      return [];
    }

    const timeSlots = [];

    for (const slot of daySchedule.timeSlots) {
      const startTime = this.parseTimeToMinutes(slot.startTime);
      const endTime = this.parseTimeToMinutes(slot.endTime);
      const slotDuration = availability.timeSlotDuration || 60;
      const bufferTime = availability.bufferTime || 0;

      let currentTime = startTime;

      while (currentTime + slotDuration <= endTime) {
        const slotStartTime = this.formatMinutesToTime(currentTime);
        const slotEndTime = this.formatMinutesToTime(currentTime + slotDuration);

        timeSlots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
          date: date.toISOString().split('T')[0] // YYYY-MM-DD format
        });

        currentTime += slotDuration + bufferTime;
      }
    }

    return timeSlots;
  }

  // Property management methods
  static async createProperty(data: {
    organizationId: string;
    title: string;
    development_name: string;
    property_code: string;
    floor?: string;
    available_units: number;
    sale_type: SaleType;
    price: number;
    area?: number;
    bedrooms: number;
    bathrooms: number;
    garage: number;
    kitchen: number;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      latitude?: number;
      longitude?: number;
    };
    description: string;
    images?: string[];
    payment_plans?: Array<{
      type: PaymentPlanType;
      name: string;
      description?: string;
      schedule: {
        deposit_amount?: number;
        monthly_payment?: number;
        duration_months?: number;
        interest_rate?: number;
        total_amount?: number;
      };
      is_active?: boolean;
    }>;
    status?: PropertyStatus;
  }) {
    // Set default values for optional fields
    const propertyData: Parameters<typeof PropertyModel.create>[0] = {
      organizationId: data.organizationId,
      title: data.title,
      development_name: data.development_name,
      property_code: data.property_code,
      floor: data.floor,
      available_units: data.available_units,
      sale_type: data.sale_type,
      price: data.price,
      area: data.area,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      garage: data.garage,
      kitchen: data.kitchen,
      location: data.location,
      description: data.description,
      images: data.images || [],
      payment_plans: data.payment_plans?.map(plan => ({
        type: plan.type,
        name: plan.name,
        description: plan.description,
        schedule: plan.schedule,
        is_active: plan.is_active !== false,
        created_at: new Date()
      })) || [],
      status: data.status || 'Available'
    };

    const property = await PropertyModel.create(propertyData);
    return property;
  }

  static async getOrganizationProperties(organizationId: string) {
    return await PropertyModel.findByOrganization(organizationId);
  }

  static async getAvailableProperties(organizationId: string) {
    return await PropertyModel.findAvailableByOrganization(organizationId);
  }

  static async getPropertyById(propertyId: string, organizationId: string) {
    const property = await PropertyModel.findByIdAndOrganization(propertyId, organizationId);
    if (!property) {
      throw new Error('Property not found');
    }
    return property;
  }

  static async updateProperty(propertyId: string, organizationId: string, updateData: any): Promise<IProperty> {
    const property = await PropertyModel.findByIdAndOrganization(propertyId, organizationId);
    if (!property) {
      throw new Error('Property not found');
    }

    const updatedProperty = await PropertyModel.updateById(propertyId, updateData);
    if (!updatedProperty) {
      throw new Error('Failed to update property');
    }
    return updatedProperty;
  }

  static async deleteProperty(propertyId: string, organizationId: string) {
    const property = await PropertyModel.findByIdAndOrganization(propertyId, organizationId);
    if (!property) {
      throw new Error('Property not found');
    }

    await PropertyModel.deleteById(propertyId);
    return { success: true, message: 'Property deleted successfully' };
  }

  static async searchProperties(filters: {
    organizationId?: string;
    city?: string;
    state?: string;
    sale_type?: SaleType;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    status?: PropertyStatus;
  }) {
    return await PropertyModel.searchProperties(filters);
  }

  // Payment plan management methods
  static async addPaymentPlan(propertyId: string, organizationId: string, paymentPlan: {
    type: PaymentPlanType;
    name: string;
    description?: string;
    schedule: {
      deposit_amount?: number;
      monthly_payment?: number;
      duration_months?: number;
      interest_rate?: number;
      total_amount?: number;
    };
    is_active?: boolean;
  }) {
    const property = await PropertyModel.findByIdAndOrganization(propertyId, organizationId);
    if (!property) {
      throw new Error('Property not found');
    }

    const newPaymentPlan = {
      type: paymentPlan.type,
      name: paymentPlan.name,
      description: paymentPlan.description,
      schedule: paymentPlan.schedule,
      is_active: paymentPlan.is_active !== false,
      created_at: new Date()
    };

    property.payment_plans.push(newPaymentPlan as any);
    await property.save();
    return property;
  }

  static async updatePaymentPlan(propertyId: string, organizationId: string, planIndex: number, updates: Partial<{
    type: PaymentPlanType;
    name: string;
    description: string;
    schedule: {
      deposit_amount?: number;
      monthly_payment?: number;
      duration_months?: number;
      interest_rate?: number;
      total_amount?: number;
    };
    is_active: boolean;
  }>) {
    const property = await PropertyModel.findByIdAndOrganization(propertyId, organizationId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (planIndex < 0 || planIndex >= property.payment_plans.length) {
      throw new Error('Payment plan not found');
    }

    // Update the payment plan
    Object.assign(property.payment_plans[planIndex], updates);
    await property.save();
    return property;
  }

  static async removePaymentPlan(propertyId: string, organizationId: string, planIndex: number) {
    const property = await PropertyModel.findByIdAndOrganization(propertyId, organizationId);
    if (!property) {
      throw new Error('Property not found');
    }

    if (planIndex < 0 || planIndex >= property.payment_plans.length) {
      throw new Error('Payment plan not found');
    }

    property.payment_plans.splice(planIndex, 1);
    await property.save();
    return property;
  }

  // Helper methods for time calculations
  private static parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
