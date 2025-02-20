// lib/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';

export interface AuthRequest extends NextApiRequest {
  user?: {
    email: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: NextApiResponse,
  next: NextHandler
) {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded as { email: string; role: string };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Client-side auth check
export function getUser(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}

interface TokenPayload {
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function verifyToken(token: string): Promise<AuthRequest['user'] | null> {
  try {
    // Try process.env.JWT_SECRET first
    const envSecret = process.env.JWT_SECRET;
    if (envSecret) {
      const decoded = jwt.verify(token, envSecret) as AuthRequest['user'];
      return decoded;
    }
    
    // Fallback to JWT_SECRET constant
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export const generateToken = async (payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string | null> => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    return jwt.sign(payload, secret, { expiresIn: '8h' });
  } catch (error) {
    console.error('Token generation failed:', error);
    return null;
  }
};