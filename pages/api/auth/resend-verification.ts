import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import { generateToken } from '../../../lib/jwt';
import { sendEmail } from '../../../lib/email';
import { withRateLimit } from '../../../lib/rate-limit';
import { withLogging } from '../../../lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user?.email || undefined },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.email_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      const token = generateToken({
        userId: parseInt(user.id.toString()),
        email: user.email,
        type: 'verification',
      });

      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        html: `
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
        `,
      });

      return res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error) {
      console.error('Resend verification email error:', error);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withRateLimit(withLogging(handler)); 