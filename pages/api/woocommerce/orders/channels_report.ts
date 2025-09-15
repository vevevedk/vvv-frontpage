import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || '/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
    
    // Forward the request to the Django backend
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    const response = await fetch(`${DJANGO_API_URL}/woocommerce/orders/channels_report/?${queryParams}`, {
      method: 'GET',
      headers: headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('WooCommerce channels report API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
