import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8001/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    let response;
    const baseUrl = `${DJANGO_API_URL}/woocommerce/channels/classifications/`;

    switch (method) {
      case 'GET':
        // Get all classifications with optional filters
        const { channel_type, is_active, search } = req.query;
        const queryParams = new URLSearchParams();
        if (channel_type) queryParams.append('channel_type', channel_type as string);
        if (is_active !== undefined) queryParams.append('is_active', is_active as string);
        if (search) queryParams.append('search', search as string);
        
        const queryString = queryParams.toString();
        const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
        
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        break;

      case 'POST':
        // Create new classification
        response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        break;

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Channel classifications API error:', error);
    res.status(500).json({ 
      error: 'Failed to process channel classification request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
















