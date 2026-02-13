-- Audit WooCommerce Analytics - SQL Queries
-- Run these on prod database to check channel attribution

-- 1. Check channel classification rules
SELECT 
    channel_type,
    source,
    medium,
    channel,
    is_active,
    created_at
FROM woocommerce_channel_classifications
WHERE is_active = true
ORDER BY channel_type, source, medium;

-- 2. Count orders by attribution data for porsa.dk (last 100 orders)
SELECT 
    attribution_utm_source AS source,
    attribution_source_type AS medium,
    COUNT(*) as order_count
FROM woocommerce_orders
WHERE client_name = 'porsa.dk'
    AND attribution_utm_source IS NOT NULL
    AND attribution_utm_source != ''
ORDER BY order_count DESC;

-- 3. Count orders by attribution data for dupskoshoppen.dk (last 100 orders)
SELECT 
    attribution_utm_source AS source,
    attribution_source_type AS medium,
    COUNT(*) as order_count
FROM woocommerce_orders
WHERE client_name = 'dupskoshoppen.dk'
    AND attribution_utm_source IS NOT NULL
    AND attribution_utm_source != ''
ORDER BY order_count DESC;

-- 4. Check for google/utm orders that should be Paid Search
SELECT 
    'Should be Paid Search (google/utm)' as check_type,
    COUNT(*) as count
FROM woocommerce_orders
WHERE client_name IN ('porsa.dk', 'dupskoshoppen.dk')
    AND attribution_utm_source = 'google'
    AND attribution_source_type = 'utm'
UNION ALL
SELECT 
    'Should be Paid Search (google/cpc)' as check_type,
    COUNT(*) as count
FROM woocommerce_orders
WHERE client_name IN ('porsa.dk', 'dupskoshoppen.dk')
    AND attribution_utm_source = 'google'
    AND attribution_source_type IN ('cpc', 'ppc');

-- 5. Orders WITHOUT attribution data (will default to Direct)
SELECT 
    client_name,
    COUNT(*) as orders_without_attribution,
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 1) as pct_of_total
FROM woocommerce_orders
WHERE client_name IN ('porsa.dk', 'dupskoshoppen.dk')
    AND (attribution_utm_source IS NULL OR attribution_utm_source = '')
GROUP BY client_name;

-- 6. Show sample orders with attribution data
SELECT 
    order_id,
    client_name,
    attribution_utm_source,
    attribution_source_type,
    order_total,
    date_created
FROM woocommerce_orders
WHERE client_name IN ('porsa.dk', 'dupskoshoppen.dk')
    AND attribution_utm_source IS NOT NULL
    AND attribution_utm_source != ''
ORDER BY date_created DESC
LIMIT 20;

-- 7. Check if ChannelClassification table exists and has data
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ChannelClassification table has data'
        ELSE '❌ ChannelClassification table is EMPTY'
    END as status,
    COUNT(*) as rule_count
FROM woocommerce_channel_classifications
WHERE is_active = true;

-- 8. Simulate channel classification for recent orders
-- This shows what channel types would be assigned
WITH order_attribution AS (
    SELECT 
        order_id,
        client_name,
        attribution_utm_source AS source,
        attribution_source_type AS medium,
        order_total,
        date_created
    FROM woocommerce_orders
    WHERE client_name IN ('porsa.dk', 'dupskoshoppen.dk')
        AND attribution_utm_source IS NOT NULL
        AND attribution_utm_source != ''
)
SELECT 
    COALESCE(cc.channel_type, 'Direct') as channel_type,
    COUNT(*) as order_count,
    SUM(order_total) as total_revenue
FROM order_attribution oa
LEFT JOIN woocommerce_channel_classifications cc ON 
    LOWER(oa.source) = LOWER(cc.source) 
    AND LOWER(oa.medium) = LOWER(cc.medium)
    AND cc.is_active = true
GROUP BY cc.channel_type
ORDER BY order_count DESC;











