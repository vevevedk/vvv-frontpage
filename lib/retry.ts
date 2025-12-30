// lib/retry.ts
// Generic retry utilities with exponential backoff, jitter, and transient error helpers

export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  jitter?: boolean;
  signal?: AbortSignal;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

export const defaultRetryOptions: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'signal'>> = {
  retries: 3,
  factor: 2,
  minTimeout: 200,
  maxTimeout: 5000,
  jitter: true,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retries,
    factor,
    minTimeout,
    maxTimeout,
    jitter,
    signal,
    shouldRetry,
    onRetry,
  } = { ...defaultRetryOptions, ...options };

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    if (signal?.aborted) {
      throw new Error('Retry aborted by signal');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || (shouldRetry && !shouldRetry(error, attempt))) {
        break;
      }

      const baseDelay = Math.min(minTimeout * Math.pow(factor, attempt), maxTimeout);
      const delay = jitter ? applyJitter(baseDelay) : baseDelay;

      onRetry?.(error, attempt + 1, delay);

      await wait(delay, signal);
    }

    attempt += 1;
  }

  throw lastError;
}

function applyJitter(delay: number): number {
  const random = Math.random();
  const jitterValue = Math.floor(random * (delay / 2));
  return delay - jitterValue;
}

function wait(delay: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(new Error('Retry aborted by signal'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

const transientPgErrorCodes = new Set([
  '57P03', // cannot_connect_now
  '53300', // too_many_connections
  '53400', // configuration_limit_exceeded
  '08000', // connection_exception
  '08003', // connection_does_not_exist
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  'HYT00', // timeout expired
]);

const transientPgErrorMessages = [
  'ECONNRESET',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'EPIPE',
  'read ECONNRESET',
  'Connection terminated unexpectedly',
  'terminating connection due to administrator command',
];

export function isTransientPgError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const pgError = error as { code?: string; message?: string };

  if (pgError.code && transientPgErrorCodes.has(pgError.code)) {
    return true;
  }

  if (pgError.message) {
    return transientPgErrorMessages.some((fragment) =>
      pgError.message?.toLowerCase().includes(fragment.toLowerCase()),
    );
  }

  return false;
}


