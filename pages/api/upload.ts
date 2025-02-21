import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { Pool } from 'pg';
import * as csvParse from 'csv-parse';

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

const transformDate = (dateString: string): string => {
    // Try parsing as Month DD, YYYY format (e.g., "Feb 10, 2025")
    const monthDayYear = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/;
    const monthMatch = dateString.match(monthDayYear);
    
    if (monthMatch) {
        const [_, month, day, year] = monthMatch;
        const monthNum = new Date(`${month} 1, 2000`).getMonth() + 1;
        return `${year}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try DD/MM/YYYY format
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(ddmmyyyy);
    
    if (match) {
        const [_, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try parsing as ISO date (YYYY-MM-DD)
    const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    const isoMatch = dateString.match(isoDate);
    
    if (isoMatch) {
        const [_, year, month, day] = isoMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // If no match, log warning and return ISO formatted date
    console.warn(`Parsing date using fallback method: ${dateString}`);
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error(`Failed to parse date: ${dateString}`);
        throw new Error(`Invalid date format: ${dateString}`);
    }
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
    console.log('Creating query with:', { 
        sanitizedTable, 
        columns,
        clientId,
        rowValues 
    });

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

    const form = formidable({});
    let currentRow: any = null; // Define currentRow at the top level

    try {
        const [fields, files] = await form.parse(req);
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        const clientId = Array.isArray(fields.clientId) ? fields.clientId[0] : fields.clientId;
        const table = Array.isArray(fields.table) ? fields.table[0] : fields.table;

        if (!file || !clientId || !table) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                details: { hasFile: !!file, hasClientId: !!clientId, hasTable: !!table }
            });
        }

        console.log('Processing file:', {
            filename: file.originalFilename,
            size: file.size,
            type: file.mimetype
        });

        // Sanitize table name before use
        const sanitizedTable = mapTableName(table);
        console.log('Using table:', sanitizedTable);

        // Read and parse CSV file
        const fileContent = fs.readFileSync(file.filepath);
        const parser = csvParse.parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        let rowCount = 0;
        let skippedCount = 0;

        for await (const row of parser) {
            currentRow = row;
            
            const transformedRow: Record<string, any> = {};
            Object.entries(row).forEach(([key, value]) => {
                const dbColumn = transformColumnName(key);
                transformedRow[dbColumn] = value;
            });

            if (transformedRow.date) {
                transformedRow.date = transformDate(transformedRow.date);
            }

            // Convert numeric fields
            transformedRow.impressions = parseInt(transformedRow.impressions, 10);
            transformedRow.url_clicks = parseInt(transformedRow.url_clicks, 10);
            transformedRow.average_position = parseFloat(transformedRow.average_position);

            const columns = Object.keys(transformedRow);
            const rowValues = Object.values(transformedRow);

            console.log('Processing row:', {
                clientId,
                columns,
                rowValues
            });

            // Pass rowValues to query creation
            const queryObj = createUpsertQuery(table, columns, clientId, rowValues);
            const result = await pool.query(queryObj.text, queryObj.values);
            
            if (result.rowCount === 0) {
                skippedCount++;
            } else {
                rowCount++;
            }
        }

        // Clean up temporary file
        fs.unlinkSync(file.filepath);

        return res.status(200).json({ 
            message: 'Upload successful',
            rowsProcessed: rowCount,
            rowsSkipped: skippedCount
        });

    } catch (error) {
        console.error('Server error:', {
            error: error,
            message: error.message,
            sampleData: currentRow // Use currentRow instead of row
        });
        return res.status(500).json({
            message: 'Upload failed',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                lastProcessedRow: currentRow // Include last processed row in error details
            } : undefined
        });
    }
}