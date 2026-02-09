import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, generateToken } from '../../../lib/jwt';
import { sendEmail } from '../../../lib/email';

// Minimal invite endpoint that sends a sign-up link to a client email.
// Creates a Django Invite record first, then sends the email with the invite token.

const DJANGO_API_URL = process.env.DJANGO_API_URL || '/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, companyName, company_id, role } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    // Forward auth header to Django
    const authHeader = req.headers.authorization || '';

    // Create invite record in Django
    let inviteToken: string | null = null;
    try {
      const djangoResp = await fetch(`${DJANGO_API_URL}/invites/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          email,
          company_id: company_id || null,
          role: role || 'company_user',
        }),
      });

      if (djangoResp.ok) {
        const inviteData = await djangoResp.json();
        inviteToken = inviteData.token;
      } else {
        const errText = await djangoResp.text();
        console.warn('Django invite creation failed:', errText);
      }
    } catch (djangoErr) {
      console.warn('Could not reach Django for invite creation:', djangoErr);
    }

    // Build invite URL — prefer Django invite token, fall back to JWT
    let inviteUrl: string;
    if (inviteToken) {
      inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invite_token=${encodeURIComponent(inviteToken)}&company=${encodeURIComponent(companyName || '')}`;
    } else {
      const token = generateToken({ userId: 0, email, type: 'verification' });
      inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?invite=${encodeURIComponent(token)}&company=${encodeURIComponent(companyName || '')}`;
    }

    // Try to send email, but don't fail the request if SMTP isn't configured
    let emailSent = false;
    try {
      await sendEmail({
        to: email,
        subject: 'You are invited to VVV Analytics',
        html: `<p>You have been invited to access channel reports.</p>
               <p><a href="${inviteUrl}">Click here to create your account</a></p>`,
      });
      emailSent = true;
    } catch (emailErr: any) {
      console.warn('Email send failed (SMTP may not be configured):', emailErr?.message);
    }

    return res.status(200).json({
      success: true,
      invite_token: inviteToken,
      email_sent: emailSent,
      invite_url: inviteUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to send invite' });
  }
}
