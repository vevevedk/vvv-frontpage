type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  cooldownMs?: number;
  timeoutMs?: number;
}

const defaultOptions: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  cooldownMs: 30_000,
  timeoutMs: 10_000,
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();

  constructor(private readonly options: Required<CircuitBreakerOptions>) {}

  private transitionTo(state: CircuitState) {
    this.state = state;
    this.failureCount = 0;
    this.successCount = 0;
  }

  async exec<T>(action: () => Promise<T>): Promise<T> {
    const { failureThreshold, successThreshold, cooldownMs, timeoutMs } = this.options;

    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('Circuit breaker timeout'));
        }, timeoutMs);
      });

      const result = await Promise.race([action(), timeoutPromise]) as Awaited<ReturnType<typeof action>>;

      if (timeout) {
        clearTimeout(timeout);
      }

      if (this.state === 'HALF_OPEN') {
        this.successCount += 1;
        if (this.successCount >= successThreshold) {
          this.transitionTo('CLOSED');
        }
      } else {
        this.transitionTo('CLOSED');
      }

      return result;
    } catch (error) {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (this.state === 'HALF_OPEN') {
        this.transitionTo('OPEN');
        this.nextAttempt = Date.now() + cooldownMs;
      } else {
        this.failureCount += 1;
        if (this.failureCount >= failureThreshold) {
          this.transitionTo('OPEN');
          this.nextAttempt = Date.now() + cooldownMs;
        }
      }

      throw error;
    }
  }
}

const breakerRegistry = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(id: string, options: CircuitBreakerOptions = {}): CircuitBreaker {
  const existing = breakerRegistry.get(id);
  if (existing) {
    return existing;
  }

  const breaker = new CircuitBreaker({ ...defaultOptions, ...options });
  breakerRegistry.set(id, breaker);
  return breaker;
}

