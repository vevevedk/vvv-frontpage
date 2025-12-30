// pages/api/clients/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { queryWithRetry } from '../../../lib/db';
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

    const { id } = req.query;

    if (typeof id !== 'string') {
        return sendErrorResponse(res, 'Invalid client ID', 400);
    }

    switch (req.method) {
        case 'PUT':
            try {
                const { name } = req.body;
                
                if (!name) {
                    return sendErrorResponse(res, 'Name is required', 400);
                }

                const result = await queryWithRetry(
                    'UPDATE clients SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                    [name, id]
                );

                if (result.rows.length === 0) {
                    return sendErrorResponse(res, 'Client not found', 404);
                }

                return sendSuccessResponse(res, result.rows[0], 200, cachePresets.realtime);
            } catch (error) {
                console.error('Error updating client:', error);
                return sendErrorResponse(res, 'Error updating client', 500, error);
            }
            break;

        case 'DELETE':
            try {
                const result = await queryWithRetry(
                    'DELETE FROM clients WHERE id = $1 RETURNING *',
                    [id]
                );

                if (result.rows.length === 0) {
                    return sendErrorResponse(res, 'Client not found', 404);
                }

                return sendSuccessResponse(res, { message: 'Client deleted successfully' }, 200, cachePresets.realtime);
            } catch (error) {
                console.error('Error deleting client:', error);
                return sendErrorResponse(res, 'Error deleting client', 500, error);
            }
            break;

        case 'GET':
            try {
                const result = await queryWithRetry(
                    'SELECT * FROM clients WHERE id = $1',
                    [id]
                );

                if (result.rows.length === 0) {
                    return sendErrorResponse(res, 'Client not found', 404);
                }

                return sendSuccessResponse(res, result.rows[0], 200, {
                    ...cachePresets.userData,
                    maxAge: 60
                });
            } catch (error) {
                console.error('Error fetching client:', error);
                return sendErrorResponse(res, 'Error fetching client', 500, error);
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}