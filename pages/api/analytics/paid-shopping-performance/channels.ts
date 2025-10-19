// pages/api/analytics/paid-shopping-performance/channels.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ channelPerformance: any[] } | { message: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await pool.query(`
      WITH date_ranges AS (
        SELECT 
          CURRENT_DATE - INTERVAL '30 days' as period_start,
          CURRENT_DATE as period_end,
          CURRENT_DATE - INTERVAL '60 days' as prev_period_start,
          CURRENT_DATE - INTERVAL '30 days' as prev_period_end,
          CURRENT_DATE - INTERVAL '1 year' - INTERVAL '30 days' as last_year_start,
          CURRENT_DATE - INTERVAL '1 year' as last_year_end
      )
      SELECT 
        period,
        channel_group,
        total_sessions,
        engaged_sessions,
        avg_engagement_rate,
        total_events,
        total_revenue
      FROM (
        SELECT 
          'Current' as period,
          channel_group,
          SUM(sessions) as total_sessions,
          SUM(engaged_sessions) as engaged_sessions,
          ROUND(AVG(engagement_rate)::numeric, 2) as avg_engagement_rate,
          SUM(event_count) as total_events,
          SUM(total_revenue) as total_revenue
        FROM ga4_channel_performance
        WHERE date BETWEEN 
          (SELECT period_start FROM date_ranges) 
          AND (SELECT period_end FROM date_ranges)
        GROUP BY channel_group
        
        UNION ALL
        
        SELECT 
          'Previous' as period,
          channel_group,
          SUM(sessions),
          SUM(engaged_sessions),
          ROUND(AVG(engagement_rate)::numeric, 2),
          SUM(event_count),
          SUM(total_revenue)
        FROM ga4_channel_performance
        WHERE date BETWEEN 
          (SELECT prev_period_start FROM date_ranges) 
          AND (SELECT prev_period_end FROM date_ranges)
        GROUP BY channel_group
        
        UNION ALL
        
        SELECT 
          'Last Year' as period,
          channel_group,
          SUM(sessions) as total_sessions,
          SUM(engaged_sessions) as engaged_sessions,
          ROUND(AVG(engagement_rate)::numeric, 2) as avg_engagement_rate,
          SUM(event_count) as total_events,
          SUM(total_revenue) as total_revenue
        FROM ga4_channel_performance
        WHERE date BETWEEN 
          (SELECT last_year_start FROM date_ranges) 
          AND (SELECT last_year_end FROM date_ranges)
        GROUP BY channel_group
      ) subq
      ORDER BY channel_group, period
    `);

    res.status(200).json({ channelPerformance: result.rows });
  } catch (error) {
    console.error('Error fetching channel data:', error);
    res.status(500).json({ message: 'Error fetching channel data' });
  }
}
