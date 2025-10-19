// pages/api/analytics/paid-shopping-performance/products.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
// import { PaidShoppingProductData } from '../../../../types/analytics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ productPerformance: any[] } | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await pool.query(`
      WITH parsed_data AS (
        SELECT 
          ad_group_name,
          regexp_match(ad_group_name, 'ps=(.*?)(&|$)') as product_match,
          regexp_match(ad_group_name, 'lc=(.*?)(&|$)') as location_match,
          account,
          SUM(impressions) as impressions,
          SUM(clicks) as clicks,
          ROUND(SUM(cost)::numeric, 2) as cost,
          SUM(conversions) as conversions,
          ROUND(SUM(conversion_value)::numeric, 2) as conversion_value,
          ROUND(SUM(clicks)::numeric * 100.0 / NULLIF(SUM(impressions), 0), 2) as ctr,
          ROUND(SUM(conversions)::numeric * 100.0 / NULLIF(SUM(clicks), 0), 2) as conv_rate
        FROM gads_adgroup_performance
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY ad_group_name, account
      )
      SELECT 
        COALESCE(product_match[1], 'Unknown') as product_name,
        COALESCE(location_match[1], 'Unknown') as location,
        account,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(cost) as cost,
        SUM(conversions) as conversions,
        SUM(conversion_value) as conversion_value,
        ROUND(AVG(ctr), 2) as avg_ctr,
        ROUND(AVG(conv_rate), 2) as avg_conv_rate
      FROM parsed_data
      GROUP BY product_match[1], location_match[1], account
      ORDER BY conversion_value DESC
      LIMIT 20
    `);

    res.status(200).json({ productPerformance: result.rows });
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ message: 'Error fetching product data' });
  }
}