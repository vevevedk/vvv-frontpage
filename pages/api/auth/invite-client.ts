import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, generateToken } from '../../../lib/jwt';
import { sendEmail } from '../../../lib/email';

// Minimal invite endpoint that sends a sign-up link to a client email.
// The actual user creation will occur on registration using the token payload.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, companyName } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const token = generateToken({ userId: 0, email, type: 'verification' });
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invite=${encodeURIComponent(token)}&company=${encodeURIComponent(companyName || '')}`;

    await sendEmail({
      to: email,
      subject: 'You are invited to VVV Analytics',
      html: `<p>You have been invited to access channel reports.</p>
             <p><a href="${inviteUrl}">Click here to create your account</a></p>`,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to send invite' });
  }
}








