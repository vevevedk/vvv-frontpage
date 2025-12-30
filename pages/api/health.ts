import { NextApiRequest, NextApiResponse } from 'next';
import { pool, queryWithRetry } from '@/lib/db';
import { getCircuitBreaker } from '@/lib/circuit-breaker';

const backendBreaker = getCircuitBreaker('backend-health', {
  failureThreshold: 3,
  successThreshold: 2,
  cooldownMs: 30_000,
  timeoutMs: 5_000,
});

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    frontend: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
    };
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      connectionPool?: {
        total: number;
        idle: number;
        waiting: number;
      };
    };
    backend?: {
      status: 'healthy' | 'unhealthy' | 'unknown';
      responseTime?: number;
    };
  };
  uptime: number;
}

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResult | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      frontend: { status: 'healthy' },
      database: { status: 'unhealthy' },
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Check database connection
  const dbStartTime = Date.now();
  try {
    const dbResult = await queryWithRetry('SELECT 1 as health_check', [], {
      retries: 2,
      timeoutMs: 3_000,
    });
    const dbResponseTime = Date.now() - dbStartTime;
    
    results.services.database = {
      status: 'healthy',
      responseTime: dbResponseTime,
      connectionPool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch (error) {
    const dbResponseTime = Date.now() - dbStartTime;
    results.services.database = {
      status: 'unhealthy',
      responseTime: dbResponseTime,
    };
    results.status = 'degraded';
  }

  // Check backend API (optional - if Django backend is available)
  const backendUrl = process.env.DJANGO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  const backendStartTime = Date.now();
  try {
    const backendResponse = await backendBreaker.exec(() =>
      fetch(`${backendUrl}/api/test/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    
    const backendResponseTime = Date.now() - backendStartTime;
    
    if (backendResponse.ok) {
      results.services.backend = {
        status: 'healthy',
        responseTime: backendResponseTime,
      };
    } else {
      results.services.backend = {
        status: 'unhealthy',
        responseTime: backendResponseTime,
      };
      results.status = 'degraded';
    }
  } catch (error) {
    const backendResponseTime = Date.now() - backendStartTime;
    results.services.backend = {
      status: 'unknown',
      responseTime: backendResponseTime,
    };
    // Don't mark as degraded if backend check fails (backend might not be required for frontend health)
  }

  // Frontend is always healthy if we reach here
  results.services.frontend.responseTime = 0; // Immediate response

  // Determine overall status
  if (results.services.database.status === 'unhealthy') {
    results.status = 'unhealthy';
  } else if (results.services.backend?.status === 'unhealthy') {
    results.status = 'degraded';
  }

  // Return appropriate status code
  const statusCode = 
    results.status === 'healthy' ? 200 :
    results.status === 'degraded' ? 200 : // Still return 200 for degraded, just indicate in response
    503; // 503 for unhealthy

  // Set cache headers (no cache for health checks)
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.setHeader('X-Health-Check', 'true');
  
  return res.status(statusCode).json(results);
}






