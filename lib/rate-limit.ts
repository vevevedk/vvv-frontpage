import rateLimit from 'express-rate-limit';
import { NextApiRequest, NextApiResponse } from 'next';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export function withRateLimit(handler: Function) {
  return async function rateLimitHandler(req: NextApiRequest, res: NextApiResponse) {
    try {
      await new Promise((resolve, reject) => {
        limiter(req, res, (result: Error | undefined) => {
          if (result instanceof Error) return reject(result);
          resolve(result);
        });
      });
      return handler(req, res);
    } catch (error) {
      return res.status(429).json({ error: 'Too many requests' });
    }
  };
} 