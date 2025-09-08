import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { withRateLimit } from '../../../lib/rate-limit';
import { withLogging } from '../../../lib/logger';
import { passwordChangeSchema } from '../../../lib/validations';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const validatedData = passwordChangeSchema.parse(req.body);
      const { current_password, new_password } = validatedData;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(current_password, user.password);

      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });

      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Password change error:', error);
      return res.status(500).json({ error: 'Failed to change password' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withRateLimit(withLogging(handler)); 