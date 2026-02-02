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

// Django SimpleJWT token payload structure
interface DjangoTokenPayload {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
}

export async function verifyToken(token: string): Promise<AuthRequest['user'] | null> {
  try {
    const secret = process.env.JWT_SECRET || JWT_SECRET;
    const decoded = jwt.verify(token, secret) as TokenPayload | DjangoTokenPayload;

    // Check if it's a Django SimpleJWT token (has user_id)
    if ('user_id' in decoded) {
      // Query the database to get user info
      const { queryWithRetry } = await import('./db');
      const result = await queryWithRetry<{ email: string; role: string }>(
        'SELECT email, role FROM users WHERE id = $1',
        [decoded.user_id]
      );

      if (result.rows.length === 0) {
        console.error('User not found for user_id:', decoded.user_id);
        return null;
      }

      return {
        email: result.rows[0].email,
        role: result.rows[0].role,
      };
    }

    // Standard token with email and role
    return decoded as AuthRequest['user'];
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