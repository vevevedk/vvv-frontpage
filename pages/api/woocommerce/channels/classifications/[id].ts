import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || '/api';

export default async function handler(req: NextApiRequest, NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid classification ID' });
  }

  try {
    let response;
    const url = `${DJANGO_API_URL}/woocommerce/channels/classifications/${id}/`;

    switch (method) {
      case 'PUT':
        // Update existing classification
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });
        break;

      case 'DELETE':
        // Delete classification
        response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        break;

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    // For DELETE, there's no response body
    if (method === 'DELETE') {
      res.status(204).end();
    } else {
      const data = await response.json();
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Channel classification API error:', error);
    res.status(500).json({ 
      error: 'Failed to process channel classification request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


















