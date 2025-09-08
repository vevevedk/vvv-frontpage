import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { clientId } = req.query;

  if (!clientId) {
    return res.status(400).json({ message: 'Client ID is required' });
  }

  try {
    // Mock data for testing the UI
    const mockData = [
      {
        date: new Date().toISOString().split('T')[0],
        rowCount: 1000,
        qualityMetrics: {
          stabilityScore: 98,
          recentChanges: 5,
          confidenceScore: 95,
          completenessScore: 97,
          consistencyScore: 96
        }
      },
      {
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        rowCount: 950,
        qualityMetrics: {
          stabilityScore: 96,
          recentChanges: 8,
          confidenceScore: 93,
          completenessScore: 95,
          consistencyScore: 94
        }
      }
    ];

    res.status(200).json(mockData);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 