// pages/api/users/me.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET and PATCH methods
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Forward the request to the Django backend
    const djangoApiUrl = process.env.DJANGO_API_URL || 'http://localhost:8001/api';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Forward authorization header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    const response = await fetch(`${djangoApiUrl}/users/me/`, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Users me API error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
}
