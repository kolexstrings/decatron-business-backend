import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'agent' | 'staff';
  organizationId: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    skills?: string[];
    avatar?: string;
    phone?: string;
    location?: string;
    experience?: number;
  };
  createdAt: Date;
}

export interface IOrganization extends Document {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  size: '1-10' | '11-50' | '51-200' | '200+';
  category: 'Property Development' | 'Property Management';
  profile?: {
    fullAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
    website?: string;
    description?: string;
    logo?: string;
    foundedYear?: number;
    specialties?: string[];
  };
  users: IUser[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'agent', 'staff'], required: true },
  organizationId: { type: String, ref: 'Organization', required: true },
  profile: {
    firstName: { type: String },
    lastName: { type: String },
    bio: { type: String },
    skills: [{ type: String }],
    avatar: { type: String },
    phone: { type: String },
    location: { type: String },
    experience: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
});

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '200+'],
    required: true,
  },
  category: {
    type: String,
    enum: ['Property Development', 'Property Management'],
    required: true,
  },
  profile: {
    fullAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },
    website: { type: String },
    description: { type: String },
    logo: { type: String },
    foundedYear: { type: Number },
    specialties: [{ type: String }],
  },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

OrganizationSchema.pre<IOrganization>('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);

export const OrganizationModel = {
  async create(
    orgData: Omit<IOrganization, keyof Document | 'users' | 'createdAt'>
  ): Promise<IOrganization> {
    const organization = new Organization(orgData);
    return await organization.save();
  },

  async findByEmail(email: string): Promise<IOrganization | null> {
    return await Organization.findOne({ email });
  },

  async findById(id: string): Promise<IOrganization | null> {
    return await Organization.findById(id);
  },
};

export const UserModel = {
  async create(userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'agent' | 'staff';
    organizationId: string;
  }): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  },

  async findByOrganizationId(organizationId: string): Promise<IUser[]> {
    return await User.find({ organizationId });
  },

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  },
};
