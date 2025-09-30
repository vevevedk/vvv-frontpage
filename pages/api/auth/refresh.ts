// pages/api/auth/refresh.ts
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
    const { refresh_token } = req.body;

    // Forward the refresh request to the Django backend
    const djangoApiUrl = process.env.DJANGO_API_URL || 'http://localhost:8001/api';
    
    const response = await fetch(`${djangoApiUrl}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: {
          message: errorData.message || 'Token refresh failed'
        }
      });
    }

    const data = await response.json();
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
}
