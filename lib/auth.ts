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