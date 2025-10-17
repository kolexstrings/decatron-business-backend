import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use a secure secret in production

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'organization' | 'admin' | 'agent' | 'staff';
  organizationId?: string;
  type?: string;
}

export const JWTUtils = {
  sign(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  },

  verify(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  },
};
