// pages/api/clients/[id]/accounts/[accountId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../../lib/db';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    console.log('Request to account operation endpoint:', {
        method: req.method,
        query: req.query,
        body: req.body,
        contentType: req.headers['content-type']
    });

    const { id, accountId } = req.query;

    if (typeof id !== 'string' || typeof accountId !== 'string') {
        return res.status(400).json({ message: 'Invalid client ID or account ID' });
    }

    switch (req.method) {
        case 'PUT':
            try {
                const { account_name, account_type, account_id, locations } = req.body;

                if (!account_name || !account_type || !account_id) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }

                // First update the account
                const result = await pool.query(
                    `UPDATE client_accounts 
                     SET account_name = $1, account_type = $2, account_id = $3
                     WHERE id = $4 AND client_id = $5
                     RETURNING *`,
                    [account_name, account_type, account_id, accountId, id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Account not found' });
                }

                // Handle locations
                if (locations && Array.isArray(locations)) {
                    // First delete all existing locations
                    await pool.query(
                        'DELETE FROM account_locations WHERE account_id = $1',
                        [accountId]
                    );

                    // Insert new locations if any exist
                    if (locations.length > 0) {
                        const locationValues = locations
                            .map((_, i) => `($1, $${i + 2})`)
                            .join(',');
                        await pool.query(
                            `INSERT INTO account_locations (account_id, location_id) 
                             VALUES ${locationValues}`,
                            [accountId, ...locations]
                        );
                    }
                }

                // Fetch the updated account with its locations
                const updatedAccount = await pool.query(
                    `SELECT 
                        ca.*,
                        COALESCE(
                            (SELECT json_agg(al.location_id)
                             FROM account_locations al
                             WHERE al.account_id = ca.id),
                            '[]'
                        ) as locations
                     FROM client_accounts ca
                     WHERE ca.id = $1`,
                    [accountId]
                );

                res.status(200).json(updatedAccount.rows[0]);
            } catch (error) {
                console.error('Error updating account:', error);
                res.status(500).json({ message: 'Error updating account' });
            }
            break;

        case 'DELETE':
            try {
                console.log('Deleting account:', {
                    client_id: id,
                    account_id: accountId
                });

                // First delete locations
                await pool.query(
                    'DELETE FROM account_locations WHERE account_id = $1',
                    [accountId]
                );

                // Then delete the account
                const result = await pool.query(
                    'DELETE FROM client_accounts WHERE id = $1 AND client_id = $2 RETURNING *',
                    [accountId, id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Account not found' });
                }

                res.status(200).json({ message: 'Account deleted successfully' });
            } catch (error) {
                console.error('Error deleting account:', error);
                res.status(500).json({ message: 'Error deleting account' });
            }
            break;

        default:
            res.setHeader('Allow', ['PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}