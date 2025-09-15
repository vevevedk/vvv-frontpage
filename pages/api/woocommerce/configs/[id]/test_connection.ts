import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || '/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward the request to the Django backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    const response = await fetch(`${DJANGO_API_URL}/woocommerce/configs/${id}/test_connection/`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('WooCommerce test connection API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
