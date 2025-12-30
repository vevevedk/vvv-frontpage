/**
 * API Response Helpers
 * 
 * Utility functions for consistent API responses with proper headers,
 * compression, and caching strategies.
 */

import { NextApiResponse } from 'next';

export interface ApiResponseOptions {
  cacheControl?: string;
  compress?: boolean;
  etag?: string;
  maxAge?: number;
}

/**
 * Set appropriate response headers for API endpoints
 */
export function setApiHeaders(
  res: NextApiResponse,
  options: ApiResponseOptions = {}
) {
  const {
    cacheControl = 'no-store, must-revalidate',
    compress = true,
    etag,
    maxAge,
  } = options;

  // Compression - Next.js handles this automatically via next.config.js
  // but we can set Accept-Encoding header hints
  if (compress) {
    res.setHeader('Accept-Encoding', 'gzip, deflate, br');
  }

  // Cache-Control header
  if (maxAge) {
    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
    );
  } else {
    res.setHeader('Cache-Control', cacheControl);
  }

  // ETag for cache validation
  if (etag) {
    res.setHeader('ETag', etag);
  }

  // Content-Type
  res.setHeader('Content-Type', 'application/json');
}

/**
 * Send successful API response with proper headers
 */
export function sendSuccessResponse<T>(
  res: NextApiResponse<T>,
  data: T,
  statusCode: number = 200,
  options: ApiResponseOptions = {}
) {
  setApiHeaders(res, options);
  return res.status(statusCode).json(data);
}

/**
 * Send error API response
 */
export function sendErrorResponse(
  res: NextApiResponse,
  message: string,
  statusCode: number = 500,
  error?: any
) {
  setApiHeaders(res, { cacheControl: 'no-store' });
  return res.status(statusCode).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : undefined,
  });
}

/**
 * Cache configuration presets for different data types
 */
export const cachePresets = {
  // Static content that rarely changes
  static: {
    maxAge: 86400, // 1 day
    cacheControl: 'public, s-maxage=86400, stale-while-revalidate=172800',
  },
  
  // Analytics data that updates daily
  analytics: {
    maxAge: 3600, // 1 hour
    cacheControl: 'public, s-maxage=3600, stale-while-revalidate=7200',
  },
  
  // User-specific data
  userData: {
    cacheControl: 'private, no-cache, must-revalidate',
  },
  
  // Real-time data
  realtime: {
    cacheControl: 'no-store, must-revalidate',
  },
  
  // Public read-only data
  public: {
    maxAge: 300, // 5 minutes
    cacheControl: 'public, s-maxage=300, stale-while-revalidate=600',
  },
};

/**
 * Generate ETag from data
 */
export function generateETag(data: any): string {
  const dataString = JSON.stringify(data);
  // Simple hash function for ETag
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${hash.toString(16)}"`;
}

/**
 * Check if request has matching ETag (for 304 Not Modified)
 */
export function checkETag(
  res: NextApiResponse,
  etag: string,
  reqETag?: string | string[]
): boolean {
  if (!reqETag) return false;
  
  const clientETag = Array.isArray(reqETag) ? reqETag[0] : reqETag;
  if (clientETag === etag) {
    setApiHeaders(res, { etag, cacheControl: 'public, max-age=3600' });
    res.status(304).end();
    return true;
  }
  
  return false;
}







