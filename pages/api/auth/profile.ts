import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import { withRateLimit } from '../../../lib/rate-limit';
import { withLogging } from '../../../lib/logger';
import { profileUpdateSchema } from '../../../lib/validations';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      const validatedData = profileUpdateSchema.parse(req.body);
      const { first_name, last_name, phone, company } = validatedData;

      const updatedUser = await prisma.user.update({
        where: { email: session.user?.email || undefined },
        data: {
          first_name,
          last_name,
          phone,
          company: company ? {
            update: {
              name: company.name,
              address: company.address,
              phone: company.phone,
              email: company.email,
            },
          } : undefined,
        },
        include: {
          company: true,
        },
      });

      return res.status(200).json({ user: updatedUser });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: (error as any).errors });
      }
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withRateLimit(withLogging(handler)); 