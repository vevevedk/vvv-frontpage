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

    const { clientId, startDate, endDate, comparisonType } = req.query;
    
    console.log('API Request params:', { clientId, startDate, endDate, comparisonType });

    try {
        // Calculate comparison dates
        const currentStart = new Date(startDate as string);
        const currentEnd = new Date(endDate as string);
        
        let compStart: Date, compEnd: Date;
        if (comparisonType === 'pop') {
            const daysDiff = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24);
            compEnd = new Date(currentStart);
            compStart = new Date(currentStart);
            compStart.setDate(compStart.getDate() - daysDiff);
        } else {
            compStart = new Date(currentStart);
            compEnd = new Date(currentEnd);
            compStart.setFullYear(compStart.getFullYear() - 1);
            compEnd.setFullYear(compEnd.getFullYear() - 1);
        }

        // Format dates for query
        const formattedDates = {
            currentStart: currentStart.toISOString().split('T')[0],
            currentEnd: currentEnd.toISOString().split('T')[0],
            compStart: compStart.toISOString().split('T')[0],
            compEnd: compEnd.toISOString().split('T')[0]
        };

        console.log('Date ranges:', formattedDates);

        const query = `
            WITH current_period AS (
                SELECT *
                FROM search_console_data
                WHERE client_id = $1
                AND date BETWEEN $2 AND $3
            ),
            comparison_period AS (
                SELECT *
                FROM search_console_data
                WHERE client_id = $1
                AND date BETWEEN $4 AND $5
            )
            SELECT 
                'current' as period,
                *
            FROM current_period
            UNION ALL
            SELECT 
                'comparison' as period,
                *
            FROM comparison_period
            ORDER BY date DESC;
        `;

        const result = await pool.query(query, [
            clientId,
            formattedDates.currentStart,
            formattedDates.currentEnd,
            formattedDates.compStart,
            formattedDates.compEnd
        ]);

        console.log('Query results:', {
            totalRows: result.rows.length,
            currentPeriod: result.rows.filter(r => r.period === 'current').length,
            comparisonPeriod: result.rows.filter(r => r.period === 'comparison').length
        });

        const response = {
            currentPeriod: {
                startDate: formattedDates.currentStart,
                endDate: formattedDates.currentEnd,
                data: result.rows.filter(r => r.period === 'current')
            },
            comparisonPeriod: {
                startDate: formattedDates.compStart,
                endDate: formattedDates.compEnd,
                data: result.rows.filter(r => r.period === 'comparison')
            }
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            message: 'Failed to fetch GSC data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}