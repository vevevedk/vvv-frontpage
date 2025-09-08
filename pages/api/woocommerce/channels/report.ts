import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8001/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { period, comparison_type, client_name } = req.query;
    
    // Get the authorization header from the request
    const authHeader = req.headers.authorization;
    
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period as string);
    if (comparison_type) queryParams.append('comparison_type', comparison_type as string);
    if (client_name) queryParams.append('client_name', client_name as string);

    const response = await fetch(`${DJANGO_API_URL}/woocommerce/orders/channels_report/?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Channel report API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch channel report data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

