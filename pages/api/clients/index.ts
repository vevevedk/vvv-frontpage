// pages/api/clients/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { queryWithRetry } from '../../../lib/db';
import { ClientWithAccounts } from '@/lib/types/clients';
import { sendSuccessResponse, sendErrorResponse, cachePresets } from '../../../lib/api-response-helpers';
import { createRateLimiter, RateLimitError } from '@/lib/rate-limit';

const rateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 300,
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        await rateLimiter.check(req, res);
    } catch (error) {
        if (error instanceof RateLimitError) {
            return sendErrorResponse(
                res,
                error.message,
                error.statusCode,
                error
            );
        }
        throw error;
    }

    switch (req.method) {
        case 'GET':
            try {
                const result = await queryWithRetry(`
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

                const clients: ClientWithAccounts[] = result.rows.map((client: any) => ({
                    ...client,
                    accounts: Array.isArray(client.accounts) ? client.accounts : [],
                }));

                return sendSuccessResponse(res, clients, 200, {
                    ...cachePresets.userData,
                    maxAge: 60 // 1 minute cache for user data
                });
            } catch (error) {
                console.error('Error fetching clients:', error);
                return sendErrorResponse(res, 'Error fetching clients', 500, error);
            }
            break;

        case 'POST':
            try {
                const { name } = req.body;
                const result = await queryWithRetry(
                    'INSERT INTO clients (name) VALUES ($1) RETURNING *',
                    [name]
                );
                return sendSuccessResponse(res, result.rows[0], 201, cachePresets.realtime);
            } catch (error) {
                console.error('Error creating client:', error);
                return sendErrorResponse(res, 'Error creating client', 500, error);
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}