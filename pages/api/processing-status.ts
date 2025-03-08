import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get processing status from your service
    const status = await getProcessingStatus();
    
    res.status(200).json(status);
  } catch (error) {
    console.error('Error getting processing status:', error);
    res.status(500).json({ message: 'Failed to get processing status' });
  }
} 