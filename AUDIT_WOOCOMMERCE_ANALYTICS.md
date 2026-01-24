# WooCommerce Analytics Audit - Paid Search Undercounting

## Problem
Your Google Sheets WooCommerce analytics reports show many more Paid Search orders than the app does. This audit will identify why.

## Quick Diagnosis - Run on Prod

### Option 1: Python Audit Script (Recommended)

```bash
# SSH to prod
ssh user@your-prod-box

# Navigate to project
cd /path/to/vvv-frontpage

# Run audit script
python audit_woocommerce_analytics.py
```

This will show:
- What channel classification rules exist in the database
- Whether orders have attribution data
- How orders are being classified
- What rules are missing

### Option 2: SQL Direct Queries

```bash
# Connect to PostgreSQL
psql -U vvv_user -d vvv_database -h localhost

# Run audit queries
\i audit_woocommerce_sql.sql
```

This will show:
- Channel classification rules in database
- Orders grouped by attribution data
- How many orders SHOULD be Paid Search
- How many orders have NO attribution data

## What to Look For

### 1. Missing Channel Classification Rules
If the database doesn't have these rules, orders won't be classified correctly:

```sql
-- Check if these rules exist:
SELECT * FROM woocommerce_channel_classifications 
WHERE source = 'google' AND medium = 'utm' AND is_active = true;
```

**Expected:** Should return at least 1 row with `channel_type = 'Paid Search'`

### 2. Orders Without Attribution Data
Many orders may not have attribution data captured:

```sql
-- Check percentage of orders with attribution
SELECT 
    client_name,
    COUNT(*) as total_orders,
    SUM(CASE WHEN attribution_utm_source IS NOT NULL THEN 1 ELSE 0 END) as with_attribution,
    ROUND(100.0 * SUM(CASE WHEN attribution_utm_source IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 1) as pct_with_attribution
FROM woocommerce_orders
WHERE client_name IN ('porsa.dk', 'dupskoshoppen.dk')
GROUP BY client_name;
```

**Expected:** Should be >50% of orders have attribution data

### 3. Google/UTM Orders Should Be Paid Search

Based on your CSV files, these source/medium combinations should be Paid Search:
- `google/utm` → Paid Search
- `google/cpc` → Paid Search
- `google/ppc` → Paid Search

## Common Issues

### Issue 1: ChannelClassification Table is Empty
**Symptoms:** All orders default to 'Direct'

**Fix:**
```bash
python manage.py update_channel_classifications
```

### Issue 2: Orders Don't Have Attribution Data
**Symptoms:** Most orders have NULL `attribution_utm_source`

**Possible Causes:**
- WooCommerce Order Attribution plugin not installed
- Plugin not configured properly
- Sync not extracting meta_data

**Fix:**
1. Install/enable WooCommerce Order Attribution plugin
2. Verify it captures UTM parameters
3. Re-sync recent orders

### Issue 3: Wrong Classification Rules
**Symptoms:** google/utm is classified as something other than 'Paid Search'

**Fix:**
- Run `python manage.py update_channel_classifications`
- Verify rules in database

## Expected vs Actual Comparison

### What Your CSV Shows (porsa.dk examples):
- `google/utm` with `chatgpt / utm` channel text = **Paid Search**
- Many orders with Paid Search classification

### What App Should Show:
- All orders with `source=google` and `medium=utm` should be **Paid Search**

## Verification Queries

After applying fixes, verify counts:

```sql
-- Check Paid Search orders in last 30 days
SELECT 
    client_name,
    COUNT(*) as paid_search_orders,
    SUM(order_total) as paid_search_revenue
FROM woocommerce_orders wo
JOIN woocommerce_channel_classifications cc ON
    LOWER(wo.attribution_utm_source) = LOWER(cc.source)
    AND LOWER(COALESCE(wo.attribution_source_type, 'utm')) = LOWER(cc.medium)
    AND cc.is_active = true
WHERE wo.client_name IN ('porsa.dk', 'dupskoshoppen.dk')
    AND cc.channel_type = 'Paid Search'
    AND wo.date_created >= NOW() - INTERVAL '30 days'
GROUP BY client_name;
```

Compare these counts to your Google Sheets exports.

## Next Steps

1. Run the audit script on prod
2. Identify which issue(s) are causing undercounting
3. Apply the recommended fixes
4. Re-run audit to verify
5. Compare counts with Google Sheets data

## Files

- `audit_woocommerce_analytics.py` - Python audit script
- `audit_woocommerce_sql.sql` - SQL queries for direct DB checks
- `backend/woocommerce/management/commands/update_channel_classifications.py` - Management command to update rules











