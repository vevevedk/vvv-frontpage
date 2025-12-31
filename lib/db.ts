// lib/db.ts
import { Pool } from 'pg';
import { retryWithBackoff, isTransientPgError } from './retry';

// Debug logging
console.log('Process ENV:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST ? 'set' : 'undefined',
    DB_USER: process.env.DB_USER ? 'set' : 'undefined',
    DB_NAME: process.env.DB_NAME ? 'set' : 'undefined',
    DB_PORT: process.env.DB_PORT ? 'set' : 'undefined',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'set' : 'undefined'
});

// Create connection config
const config: {
    host: string | undefined;
    user: string | undefined;
    database: string | undefined;
    port: number;
    password?: string;
} = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432
};

// Only add password if it's set
if (process.env.DB_PASSWORD) {
    config.password = process.env.DB_PASSWORD;
}

if (!config.host || !config.user || !config.database || !config.port) {
    console.error('Missing database configuration:', {
        host: !config.host,
        user: !config.user,
        database: !config.database,
        port: !config.port
    });
    throw new Error('Database configuration not complete');
}

// Enhanced connection pool configuration for better performance and reliability
// Note: Using type assertion as pg PoolConfig types may not include all valid options
export const pool = new Pool({
    ...config,
    // Connection pool settings
    max: 20,                        // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,       // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000,  // How long to wait for connection (5 seconds)
    
    // Query timeout (via statement_timeout - set on connection)
    statement_timeout: 10000,       // 10 second query timeout
    
    // Connection validation
    allowExitOnIdle: false,         // Keep pool alive even when idle
} as any); // Type assertion needed as pg types don't include all pool options

export interface QueryOptions {
    retries?: number;
    timeoutMs?: number;
}

export async function queryWithRetry<T = any>(
    text: string,
    params?: any[],
    options: QueryOptions = {}
) {
    const { retries = 3, timeoutMs } = options;

    const controller = timeoutMs ? new AbortController() : undefined;
    const signal = controller?.signal;

    let timeoutRef: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
        timeoutRef = setTimeout(() => controller?.abort(), timeoutMs);
        if (typeof (timeoutRef as any).unref === 'function') {
            (timeoutRef as NodeJS.Timeout).unref();
        }
    }

    try {
        return await retryWithBackoff(
            async () => pool.query<T>(text, params),
            {
                retries,
                signal,
                shouldRetry: (error) => isTransientPgError(error),
                onRetry: (error, attempt, delay) => {
                    if (process.env.NODE_ENV !== 'test') {
                        console.warn(
                            `Retrying query (attempt ${attempt}/${retries}) in ${delay}ms due to error:`,
                            error
                        );
                    }
                },
            }
        );
    } finally {
        if (timeoutRef) {
            clearTimeout(timeoutRef);
        }
    }
}

// Add error handler
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit process - let it handle errors gracefully
    // process.exit(-1);
});

// Add connection event handlers for monitoring
pool.on('connect', (client) => {
    // Set statement timeout for this connection
    client.query('SET statement_timeout = 10000').catch(err => {
        console.warn('Failed to set statement timeout:', err);
    });
});

// Log pool statistics (useful for debugging)
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const poolStats = {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount,
        };
        if (poolStats.totalCount > 0) {
            console.log('Pool stats:', poolStats);
        }
    }, 60000); // Log every minute
}