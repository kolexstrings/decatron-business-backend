import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { JWTUtils } from '../utils/jwt';
import { EmailUtils } from '../utils/email';

export class AuthController {
  static async registerOrganization(req: Request, res: Response) {
    try {
      const { name, email, password, phoneNumber, size, category } = req.body;

      if (!name || !email || !password || !size || !category) {
        return res.status(400).json({
          error: 'Name, email, password, size, and category are required',
        });
      }

      const { organization, token } = await AuthService.registerOrganization({
        name,
        email,
        password,
        phoneNumber,
        size,
        category,
      });

      res.status(201).json({
        message: 'Organization registered successfully',
        token,
        organization: {
          id: organization.id,
          name: organization.name,
          email: organization.email,
          phoneNumber: organization.phoneNumber,
          size: organization.size,
          category: organization.category,
        },
      });
    } catch (error: any) {
      res.status(409).json({ error: error.message });
    }
  }

  static async loginOrganization(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { organization, token } = await AuthService.loginOrganization(email, password);

      res.json({
        message: 'Login successful',
        token,
        organization: {
          id: organization.id,
          name: organization.name,
          email: organization.email,
        },
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async addUser(req: AuthRequest, res: Response) {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password || !role) {
        return res.status(400).json({ error: 'Username, email, password, and role are required' });
      }

      const user = await AuthService.addUser({
        username,
        email,
        password,
        role,
        organizationId: req.user!.organizationId!,
      });

      res.status(201).json({
        message: 'User added successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(409).json({ error: error.message });
    }
  }

  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const users = await AuthService.getUsers(req.user!.organizationId!);
      res.json({ users });
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { user, token } = await AuthService.loginUser(email, password);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async updateUserProfile(req: AuthRequest, res: Response) {
    try {
      const { profile } = req.body;
      const user = await AuthService.updateUserProfile(req.user!.userId, profile);
      res.json({
        message: 'Profile updated successfully',
        user: { id: user.id, profile: user.profile },
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async updateOrganizationProfile(req: AuthRequest, res: Response) {
    try {
      const { profile } = req.body;
      const organization = await AuthService.updateOrganizationProfile(
        req.user!.organizationId!,
        profile
      );
      res.json({
        message: 'Profile updated successfully',
        organization: { id: organization.id, profile: organization.profile },
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async generateInvite(req: AuthRequest, res: Response) {
    try {
      const { email, role } = req.body;

      if (!email || !role || !['admin', 'agent', 'staff'].includes(role)) {
        return res.status(400).json({ error: 'Email and valid role are required' });
      }

      const organization = await AuthService.getOrganization(req.user!.organizationId!);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const token = await AuthService.generateInvite({
        email,
        role,
        organizationId: req.user!.organizationId!,
      });

      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite?token=${token}`;

      if (req.body.sendEmail) {
        await EmailUtils.sendInvite(email, inviteLink, organization.name);
      }

      res.json({ message: 'Invite link generated successfully', inviteLink });
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async validateInvite(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const decoded = JWTUtils.verify(token);

      if (!decoded || decoded.type !== 'invite') {
        return res.status(400).json({ error: 'Invalid or expired invite link' });
      }

      res.json({
        valid: true,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role,
      });
    } catch (error) {
      res.status(400).json({ error: 'Invalid or expired invite link' });
    }
  }

  static async registerUser(req: Request, res: Response) {
    try {
      const { token, username, password } = req.body;

      if (!token || !username || !password) {
        return res.status(400).json({ error: 'Token, username, and password are required' });
      }

      const user = await AuthService.registerUserViaInvite({ token, username, password });

      res.status(201).json({
        message: 'User registered successfully',
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async sendOtp(req: Request, res: Response) {
    try {
      const { email, purpose } = req.body;

      if (!email || !purpose || !['registration', 'invite'].includes(purpose)) {
        return res.status(400).json({ error: 'Email and valid purpose are required' });
      }

      await AuthService.sendOtp(email, purpose);
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp, purpose } = req.body;

      if (!email || !otp || !purpose) {
        return res.status(400).json({ error: 'Email, OTP, and purpose are required' });
      }

      const isValid = await AuthService.verifyOtp(email, otp, purpose);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      res.json({ message: 'OTP verified successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
