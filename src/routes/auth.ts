import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { OrganizationModel, UserModel } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Organization registration
router.post('/register-organization', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingOrg = await OrganizationModel.findByEmail(email);
    if (existingOrg) {
      return res.status(409).json({ error: 'Organization with this email already exists' });
    }

    const organization = await OrganizationModel.create({ name, email, password });
    const token = JWTUtils.sign({ userId: organization.id, email: organization.email, role: 'organization', organizationId: organization.id });

    res.status(201).json({ message: 'Organization registered successfully', token, organization: { id: organization.id, name: organization.name, email: organization.email } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Organization login
router.post('/login-organization', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const organization = await OrganizationModel.findByEmail(email);
    if (!organization) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, organization.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = JWTUtils.sign({ userId: organization.id, email: organization.email, role: 'organization', organizationId: organization.id });

    res.json({ message: 'Login successful', token, organization: { id: organization.id, name: organization.name, email: organization.email } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add sub-user (staff or agent) - only organization can do this
router.post('/add-user', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      return res.status(403).json({ error: 'Only organizations can add users' });
    }

    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, password, and role are required' });
    }

    if (!['staff', 'agent'].includes(role)) {
      return res.status(400).json({ error: 'Role must be staff or agent' });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const user = await UserModel.create({ username, email, password, role, organizationId: req.user.organizationId! });

    res.status(201).json({ message: 'User added successfully', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users for an organization
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'organization') {
      return res.status(403).json({ error: 'Only organizations can view users' });
    }

    const users = await UserModel.findByOrganizationId(req.user.organizationId!);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sub-user login
router.post('/login-user', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = JWTUtils.sign({ userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId });

    res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
