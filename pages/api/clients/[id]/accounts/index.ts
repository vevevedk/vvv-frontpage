// pages/api/clients/[id]/accounts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../../lib/db';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    console.log('Request to accounts collection endpoint:', {
        method: req.method,
        query: req.query,
        body: req.body,
        contentType: req.headers['content-type']
    });

    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid client ID' });
    }

    if (req.method === 'POST') {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { account_name, account_type, account_id, locations } = req.body;

            // Improved duplicate check with more details
            const existingAccount = await client.query(
                `SELECT account_name, account_id 
                 FROM client_accounts 
                 WHERE client_id = $1 AND account_id = $2`,
                [id, account_id]
            );

            if (existingAccount.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ 
                    message: `Account ID "${account_id}" is already in use for this client (${existingAccount.rows[0].account_name})`,
                    existingAccount: existingAccount.rows[0]
                });
            }

            // Create account with a try-catch specifically for constraint violations
            try {
                const accountResult = await client.query(
                    `INSERT INTO client_accounts (client_id, account_name, account_type, account_id)
                     VALUES ($1, $2, $3, $4)
                     RETURNING *`,
                    [id, account_name, account_type, account_id]
                );

                // Insert locations if provided
                if (locations?.length > 0) {
                    const locationValues = locations
                        .map((_: any, i: number) => `($1, $${i + 2})`)
                        .join(',');
                    
                    await client.query(
                        `INSERT INTO account_locations (account_id, location_id)
                         VALUES ${locationValues}`,
                        [accountResult.rows[0].id, ...locations]
                    );
                }

                await client.query('COMMIT');
                
                // Fetch complete account data
                const finalResult = await client.query(`
                    SELECT 
                        ca.*,
                        COALESCE(
                            (
                                SELECT json_agg(al.location_id)
                                FROM account_locations al
                                WHERE al.account_id = ca.id
                            ),
                            '[]'::json
                        ) as locations
                    FROM client_accounts ca
                    WHERE ca.id = $1`,
                    [accountResult.rows[0].id]
                );

                res.status(201).json(finalResult.rows[0]);
            } catch (err: any) {
                await client.query('ROLLBACK');
                if (err.constraint === 'client_accounts_unique_per_client') {
                    return res.status(409).json({
                        message: `Account ID "${account_id}" is already in use for this client.`
                    });
                }
                throw err; // Re-throw other errors
            }
        } catch (error) {
            console.error('Error creating account:', error);
            res.status(500).json({ 
                message: 'Error creating account',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        } finally {
            client.release();
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}