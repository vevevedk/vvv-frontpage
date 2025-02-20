// lib/db.ts
import { Pool } from 'pg';

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
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432
};

// Only add password if it's set
if (process.env.DB_PASSWORD) {
    config['password'] = process.env.DB_PASSWORD;
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

export const pool = new Pool(config);

// Add error handler
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});