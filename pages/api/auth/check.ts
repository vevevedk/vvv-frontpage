// pages/api/auth/check.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  console.log('JWT_SECRET available:', !!JWT_SECRET); // Log if secret exists

  try {
    console.log('Cookies received:', req.cookies);
    const token = req.cookies.auth_token;

    if (!token) {
      console.log('No auth_token cookie found');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified:', decoded);

    return res.status(200).json({ authenticated: true });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}