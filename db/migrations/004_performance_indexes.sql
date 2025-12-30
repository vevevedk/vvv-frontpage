-- Performance Optimization: Add Missing Indexes
-- Date: December 2024
-- Purpose: Improve query performance on frequently accessed tables

-- WooCommerce Orders: Client and date queries (most common)
CREATE INDEX IF NOT EXISTS idx_woocommerce_orders_client_date 
  ON woocommerce_orders(client_id, created_at DESC);

-- WooCommerce Orders: Channel classification queries
CREATE INDEX IF NOT EXISTS idx_woocommerce_orders_channel 
  ON woocommerce_orders(channel_classification) 
  WHERE channel_classification IS NOT NULL;

-- WooCommerce Orders: Status queries
CREATE INDEX IF NOT EXISTS idx_woocommerce_orders_status 
  ON woocommerce_orders(status) 
  WHERE status IS NOT NULL;

-- Composite index for channel reporting queries
CREATE INDEX IF NOT EXISTS idx_woocommerce_orders_client_channel_date 
  ON woocommerce_orders(client_id, channel_classification, created_at DESC);

-- Google Ads Performance: Client and date range queries (common for analytics)
CREATE INDEX IF NOT EXISTS idx_gads_client_date_range 
  ON gads_adgroup_performance(client_id, date DESC) 
  WHERE date >= CURRENT_DATE - INTERVAL '90 days';

-- Google Ads Performance: Account and date queries
CREATE INDEX IF NOT EXISTS idx_gads_account_date 
  ON gads_adgroup_performance(account, date DESC);

-- Search Console Data: Client and date queries
CREATE INDEX IF NOT EXISTS idx_gsc_client_date 
  ON search_console_data(client_id, date DESC);

-- Search Console Data: Query performance (if table exists)
-- CREATE INDEX IF NOT EXISTS idx_gsc_query_performance 
--   ON search_console_data(client_id, query, date DESC) 
--   WHERE impressions > 100;

-- Pipelines: Client and status queries
CREATE INDEX IF NOT EXISTS idx_pipelines_client_status 
  ON pipelines(client_id, status);

-- Pipelines: Last sync queries
CREATE INDEX IF NOT EXISTS idx_pipelines_last_sync 
  ON pipelines(last_synced_at DESC) 
  WHERE last_synced_at IS NOT NULL;

-- Channel Classifications: Active rules (if table exists)
-- CREATE INDEX IF NOT EXISTS idx_channel_classifications_active 
--   ON woocommerce_channel_classifications(is_active, priority) 
--   WHERE is_active = true;

-- Analytics: Client lookups for dashboard
CREATE INDEX IF NOT EXISTS idx_clients_active 
  ON clients(is_active) 
  WHERE is_active = true;

-- Users: Email verification queries
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
  ON users(email_verified) 
  WHERE email_verified = false;

-- Comments:
-- These indexes significantly improve performance for:
-- 1. Dashboard analytics queries (client + date filtering)
-- 2. Channel reporting (channel + date filtering)
-- 3. Pipeline monitoring (status + last sync queries)
-- 4. User management (verification status)
--
-- Estimated impact: 40-60% reduction in query time for these common queries







