import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8001/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const { id } = req.query;
    
    // Get the authorization header from the request
    const authHeader = req.headers.authorization;
    
    const response = await fetch(`${DJANGO_API_URL}/pipelines/${id}/`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Pipeline API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}















