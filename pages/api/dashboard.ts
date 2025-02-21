import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { clientId } = req.query;

    if (!clientId) {
        return res.status(400).json({ message: 'Client ID is required' });
    }

    try {
        console.log('Fetching stats for client:', clientId);
        
        const query = `
            SELECT 
                table_name,
                COUNT(*) as row_count,
                MAX(date::date) as max_date,
                MIN(date::date) as min_date,
                MAX(imported_at) as last_update
            FROM (
                SELECT 
                    'Search Console Data' as table_name,
                    date,
                    imported_at
                FROM search_console_data
                WHERE client_id = $1
            ) combined
            GROUP BY table_name
            ORDER BY table_name;
        `;

        const result = await pool.query(query, [clientId]);
        console.log('Query result:', result.rows);
        
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Dashboard error:', error);
        return res.status(500).json({ 
            message: 'Failed to fetch dashboard data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}