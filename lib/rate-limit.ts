import { NextApiRequest, NextApiResponse } from 'next';

export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyGenerator?: (req: NextApiRequest) => string;
  enabled?: boolean;
}

interface RateLimitState {
  count: number;
  reset: number;
}

export class RateLimitError extends Error {
  public readonly statusCode = 429;
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

const stores = new Map<string, RateLimitState>();

function defaultKeyGenerator(req: NextApiRequest): string {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';
  return `${ip}:${req.method}:${req.url}`;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, limit, keyGenerator = defaultKeyGenerator, enabled = true } = options;

  if (!enabled || process.env.RATE_LIMITING_DISABLED === 'true') {
    return {
      async check() {
        return { remaining: Number.POSITIVE_INFINITY };
      },
    };
  }

  return {
    async check(req: NextApiRequest, res: NextApiResponse) {
      const now = Date.now();
      const key = keyGenerator(req);
      const reset = now + windowMs;

      const existing = stores.get(key);

      const state: RateLimitState =
        existing && existing.reset > now
          ? { count: existing.count + 1, reset: existing.reset }
          : { count: 1, reset };

      stores.set(key, state);

      const remaining = Math.max(0, limit - state.count);

      const retryAfter = Math.ceil((state.reset - now) / 1000);

      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', state.reset.toString());

      if (state.count > limit) {
        res.setHeader('Retry-After', retryAfter.toString());
        throw new RateLimitError('Too many requests. Please try again later.', retryAfter);
      }

      return { remaining };
    },
  };
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of stores.entries()) {
    if (value.reset <= now) {
      stores.delete(key);
    }
  }
}

// Periodically clean up expired entries to avoid unbounded memory growth
if (typeof global !== 'undefined') {
  const globalWithCleanup = global as typeof global & { __vvvRateLimitCleanup?: NodeJS.Timeout };
  if (!globalWithCleanup.__vvvRateLimitCleanup) {
    globalWithCleanup.__vvvRateLimitCleanup = setInterval(() => {
      cleanupRateLimitStore();
    }, 60_000);
    if (typeof globalWithCleanup.__vvvRateLimitCleanup.unref === 'function') {
      globalWithCleanup.__vvvRateLimitCleanup.unref();
    }
  }
} 