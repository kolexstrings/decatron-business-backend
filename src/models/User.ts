import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'staff' | 'agent';
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IOrganization extends Document {
  name: string;
  email: string;
  password: string;
  users: IUser[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['staff', 'agent'], required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdAt: { type: Date, default: Date.now },
});

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
  async create(orgData: Omit<IOrganization, keyof Document | 'users' | 'createdAt'>): Promise<IOrganization> {
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
  async create(userData: Omit<IUser, keyof Document | 'createdAt'>): Promise<IUser> {
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
