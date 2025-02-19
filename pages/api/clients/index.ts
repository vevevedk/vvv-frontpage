// pages/api/clients/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { Client } from '../../../types/clients';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    switch (req.method) {
        case 'GET':
            try {
                const result = await pool.query(`
                    SELECT 
                        c.*,
                        json_agg(
                            json_build_object(
                                'id', ca.id,
                                'account_name', ca.account_name,
                                'account_type', ca.account_type,
                                'account_id', ca.account_id,
                                'locations', COALESCE(
                                    (
                                        SELECT json_agg(al.location_id)
                                        FROM account_locations al
                                        WHERE al.account_id = ca.id
                                    ),
                                    '[]'::json
                                )
                            )
                        ) FILTER (WHERE ca.id IS NOT NULL) as accounts
                    FROM clients c
                    LEFT JOIN client_accounts ca ON c.id = ca.client_id
                    GROUP BY c.id
                    ORDER BY c.created_at DESC
                `);

                const clients = result.rows.map(client => ({
                    ...client,
                    accounts: client.accounts || []
                }));

                res.status(200).json(clients);
            } catch (error) {
                console.error('Error fetching clients:', error);
                res.status(500).json({ message: 'Error fetching clients' });
            }
            break;

        case 'POST':
            try {
                const { name } = req.body;
                const result = await pool.query(
                    'INSERT INTO clients (name) VALUES ($1) RETURNING *',
                    [name]
                );
                res.status(201).json(result.rows[0]);
            } catch (error) {
                console.error('Error creating client:', error);
                res.status(500).json({ message: 'Error creating client' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}