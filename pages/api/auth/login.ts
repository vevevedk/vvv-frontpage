// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';

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

    // Forward the login request to the Django backend
    const djangoApiUrl = process.env.DJANGO_API_URL || 'http://localhost:8001/api';
    
    const response = await fetch(`${djangoApiUrl}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        success: false,
        message: errorData.detail || 'Login failed'
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...data  // Forward the actual backend response with real user data
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}