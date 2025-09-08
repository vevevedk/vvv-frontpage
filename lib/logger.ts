import winston from 'winston';
import { NextApiRequest, NextApiResponse } from 'next';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export function withLogging(handler: Function) {
  return async function loggingHandler(req: NextApiRequest, res: NextApiResponse) {
    const start = Date.now();
    const { method, url, query, body } = req;

    try {
      const result = await handler(req, res);
      const duration = Date.now() - start;

      logger.info('API Request', {
        method,
        url,
        query,
        body: method !== 'GET' ? body : undefined,
        status: res.statusCode,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error('API Error', {
        method,
        url,
        query,
        body: method !== 'GET' ? body : undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      });

      throw error;
    }
  };
}

export default logger; 