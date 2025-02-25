import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { Pool } from 'pg';
import { parse } from 'csv-parse';

export const config = {
    api: {
        bodyParser: false,
    },
};

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Update the transformColumnName function
const transformColumnName = (columnName: string): string => {
    return columnName
        .toLowerCase()
        .replace(/\s+/g, '_')        // replace spaces with underscores
        .replace(/[^a-z0-9_]/g, '')  // remove special characters
        .replace(/^[0-9]/, '_$&');   // prefix with underscore if starts with number
};

// Add debug logging for CSV parsing
const parseCSV = async (fileContent: string) => {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        })
        .on('data', (data) => results.push(data))
        .on('error', reject)
        .on('end', () => resolve(results));
    });
};

const transformDate = (dateString: string): string => {
    if (!dateString) {
        throw new Error('Date string is required');
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
    }

    return date.toISOString().split('T')[0];
};

// Add a mapping function for table names
const mapTableName = (displayName: string): string => {
    const tableMap: Record<string, string> = {
        'Search Console Data': 'search_console_data',
        'Paid Shopping Data': 'paid_shopping_data'
    };
    return tableMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '_');
};

// Modify the createUpsertQuery function
const createUpsertQuery = (table: string, columns: string[], clientId: string, rowValues: any[]) => {
    const sanitizedTable = mapTableName(table);
    
    return {
        text: `
            INSERT INTO ${sanitizedTable} (${['client_id', ...columns].join(', ')})
            VALUES ($1, ${columns.map((_, i) => `$${i + 2}`).join(', ')})
            ON CONFLICT (
                client_id, date, query, landing_page, 
                country, impressions, url_clicks, average_position
            ) 
            DO NOTHING
        `,
        values: [clientId, ...rowValues]
    };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const form = formidable();
        const [fields, files] = await form.parse(req);
        
        const file = files.file?.[0];
        const clientId = fields.clientId?.[0];
        
        if (!file || !clientId) {
            return res.status(400).json({ message: 'Missing file or client ID' });
        }

        const fileContent = await fs.readFile(file.filepath, 'utf-8');
        const records = await parseCSV(fileContent);
        
        let rowsProcessed = 0;
        let skippedCount = 0;

        if (fields.dataType[0] === 'search_console_daily') {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                for (const record of records) {
                    try {
                        const mappedRecord = {
                            date: transformDate(record.Date),
                            query: record.Query,
                            landing_page: record['Landing Page'],
                            impressions: parseInt(record.Impressions) || 0,
                            url_clicks: parseInt(record['Url Clicks']) || 0,
                            average_position: parseFloat(record['Average Position']) || 0,
                            country: record.Country || 'Unknown'
                        };

                        await client.query(`
                            INSERT INTO search_console_data 
                            (date, query, landing_page, impressions, url_clicks, average_position, client_id, country)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (date, query, landing_page, client_id, country) 
                            DO UPDATE SET
                                impressions = EXCLUDED.impressions,
                                url_clicks = EXCLUDED.url_clicks,
                                average_position = EXCLUDED.average_position
                        `, [
                            mappedRecord.date,
                            mappedRecord.query,
                            mappedRecord.landing_page,
                            mappedRecord.impressions,
                            mappedRecord.url_clicks,
                            mappedRecord.average_position,
                            clientId,
                            mappedRecord.country
                        ]);
                        
                        rowsProcessed++;
                    } catch (error) {
                        console.warn('Skip record:', error.message);
                        skippedCount++;
                    }
                }

                await client.query('COMMIT');
                
                return res.status(200).json({
                    message: `Processed ${rowsProcessed} rows, skipped ${skippedCount} duplicates`,
                    rowsProcessed,
                    skippedCount,
                    totalRows: records.length
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }

        return res.status(400).json({ message: 'Invalid data type' });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            message: 'Upload failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}