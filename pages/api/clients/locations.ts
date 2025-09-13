import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';

interface Location {
  id: number;
  country_name: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Fetch all locations from the database
    const result = await pool.query(`
      SELECT id, country_code, country_name 
      FROM locations 
      ORDER BY country_name ASC`
    );

    // Add console.log to debug
    console.log('Fetched locations:', result.rows);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Error fetching locations' });
  }
}