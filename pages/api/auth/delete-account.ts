import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import { withRateLimit } from '../../../lib/rate-limit';
import { withLogging } from '../../../lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'DELETE') {
    try {
      // Delete user's company first (if it exists)
      await prisma.company.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: session.user.id },
      });

      return res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Account deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withRateLimit(withLogging(handler)); 