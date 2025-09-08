import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/jwt';
import { withRateLimit } from '../../../lib/rate-limit';
import { withLogging } from '../../../lib/logger';
import { emailVerificationSchema } from '../../../lib/validations';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const validatedData = emailVerificationSchema.parse(req.body);
      const { token } = validatedData;

      const decoded = await verifyToken(token);
      if (!decoded || !decoded.userId) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { email_verified: true },
        include: {
          company: true,
        },
      });

      return res.status(200).json({ user });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Email verification error:', error);
      return res.status(500).json({ error: 'Failed to verify email' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withRateLimit(withLogging(handler)); 