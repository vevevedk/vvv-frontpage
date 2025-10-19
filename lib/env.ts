/**
 * Environment Variable Validation
 * 
 * This module validates all environment variables at runtime
 * to catch configuration errors early and provide helpful error messages.
 */

import { z } from 'zod';

// Client-side environment variables (exposed to browser)
const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('/api'),
  NEXT_PUBLIC_IGNORE_BUILD_ERRORS: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_IGNORE_LINT_ERRORS: z.enum(['true', 'false']).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Server-side environment variables (Node.js only)
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('marketing_analytics'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DJANGO_API_URL: z.string().url().optional(),
});

// Combine schemas based on environment
const envSchema = typeof window === 'undefined'
  ? serverSchema.merge(clientSchema)
  : clientSchema;

// Parse and validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      console.error(
        '❌ Invalid environment variables:\n' + missingVars + '\n'
      );

      throw new Error('Environment validation failed. Check your .env files.');
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment access
export function getEnv<T extends keyof typeof env>(key: T): typeof env[T] {
  return env[key];
}

// Helper to check if we're in development
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Helper to get API URL
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return env.NEXT_PUBLIC_API_URL;
  }
  // Server-side - use process.env directly since we're on the server
  return process.env.DJANGO_API_URL || 'http://backend:8000/api';
}


