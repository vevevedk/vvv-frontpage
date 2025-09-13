import { NextApiRequest, NextApiResponse } from 'next';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8001/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  try {
    const authHeader = req.headers.authorization;
    const url = new URL(`${DJANGO_API_URL}/pipeline-quality-checks/`);
    Object.entries(req.query).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((vv) => url.searchParams.append(k, String(vv)));
      else if (v !== undefined) url.searchParams.set(k, String(v));
    });
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Pipeline quality checks proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}




