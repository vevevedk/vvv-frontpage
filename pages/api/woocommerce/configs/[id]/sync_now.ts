import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8001/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  console.log('Sync now API called:', { method, id });

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward the request to the Django backend
    const djangoUrl = `${DJANGO_API_URL}/woocommerce/configs/${id}/sync_now/`;
    console.log('Forwarding to Django:', djangoUrl);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
      console.log('Authorization header:', req.headers.authorization.substring(0, 20) + '...');
    }
    
    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(req.body),
    });

    console.log('Django response status:', response.status);
    console.log('Django response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Django response body (first 200 chars):', responseText.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Django response as JSON:', parseError);
      console.error('Full Django response:', responseText);
      return res.status(500).json({ 
        error: 'Django returned invalid JSON', 
        djangoStatus: response.status,
        djangoResponse: responseText.substring(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('WooCommerce sync now API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
