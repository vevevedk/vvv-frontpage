import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8001/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period, client_name } = req.query;
    const params = new URLSearchParams();
    
    if (period) params.append('period', period as string);
    if (client_name) params.append('client_name', client_name as string);
    
    const url = `${DJANGO_API_URL}/woocommerce/orders/analytics/?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('WooCommerce analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 