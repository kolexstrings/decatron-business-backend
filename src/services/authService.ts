import bcrypt from 'bcrypt';
import { OrganizationModel, UserModel } from '../models/User';
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
}
