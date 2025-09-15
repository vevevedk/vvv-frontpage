import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || '/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { period = '30', client_name } = req.query;

  try {
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period as string);
    if (client_name) queryParams.append('client_name', client_name as string);

    const response = await fetch(`${DJANGO_API_URL}/woocommerce/orders/analytics/?${queryParams}`, {
      method,
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