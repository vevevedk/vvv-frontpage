// pages/api/clients/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid client ID' });
    }

    switch (req.method) {
        case 'PUT':
            try {
                const { name } = req.body;
                
                if (!name) {
                    return res.status(400).json({ message: 'Name is required' });
                }

                const result = await pool.query(
                    'UPDATE clients SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                    [name, id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Client not found' });
                }

                res.status(200).json(result.rows[0]);
            } catch (error) {
                console.error('Error updating client:', error);
                res.status(500).json({ message: 'Error updating client' });
            }
            break;

        case 'DELETE':
            try {
                const result = await pool.query(
                    'DELETE FROM clients WHERE id = $1 RETURNING *',
                    [id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Client not found' });
                }

                res.status(200).json({ message: 'Client deleted successfully' });
            } catch (error) {
                console.error('Error deleting client:', error);
                res.status(500).json({ message: 'Error deleting client' });
            }
            break;

        case 'GET':
            try {
                const result = await pool.query(
                    'SELECT * FROM clients WHERE id = $1',
                    [id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Client not found' });
                }

                res.status(200).json(result.rows[0]);
            } catch (error) {
                console.error('Error fetching client:', error);
                res.status(500).json({ message: 'Error fetching client' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}