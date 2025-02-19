// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

// In production, this should be a secure environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // In production, validate against a database
    // For now, using hardcoded credentials
    if (email === 'andreas@veveve.dk' && password === 'avxzVvv2k25!!') {
      // Create JWT token
      const token = jwt.sign(
        {
          email,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Set HTTP-only cookie
      res.setHeader('Set-Cookie', serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/',
      }));

      return res.status(200).json({
        success: true,
        message: 'Login successful'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}