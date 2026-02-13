# WooCommerce Analytics Reporting - Paid Search Undercounting Investigation

**Date**: October 28, 2025  
**Issue**: Google Sheets WooCommerce analytics show significantly more Paid Search orders than the app  
**Status**: Root cause identified, partial fix applied, sync issue discovered

## Problem Summary

The WooCommerce analytics dashboard was showing 0 Paid Search orders while Google Sheets exports showed many Paid Search orders for both `porsa.dk` and `dupskoshoppen.dk`.

## Investigation Findings

### 1. Channel Classification Rules Missing ✅ FIXED
- **Root Cause**: The `ChannelClassification` table was empty
- **Impact**: All orders defaulted to "Direct" channel instead of proper classification
- **Solution**: Ran `python3 manage.py update_channel_classifications`
- **Result**: Created 15 classification rules including critical `google/utm → Paid Search`

### 2. Attribution Data Present ✅ VERIFIED
- **Porsa.dk**: 1,029 total orders, 100% have attribution data
- **Dupskoshoppen.dk**: 2,779 total orders, 99.9% have attribution data
- **Google/UTM Orders Found**:
  - Porsa.dk: 64 `google/utm` orders
  - Dupskoshoppen.dk: 258 `google/utm` orders
  - **Total**: 322 orders that should be classified as Paid Search

### 3. Classification Working ✅ VERIFIED
- **All Time Data**: 322 orders correctly classified as Paid Search
- **Porsa.dk**: 64 Paid Search orders (79,238.77 DKK)
- **Dupskoshoppen.dk**: 258 Paid Search orders (93,630.06 DKK)
- **Classification Rules Active**: 15 rules including `google/utm → Paid Search`

### 4. Date Filter Issue ✅ IDENTIFIED
- **UI Default Filter**: "Last 55 days"
- **Google/UTM Orders Age**: Newest from April 7, 2025 (204 days ago)
- **Result**: 0 Paid Search orders in 55-day view, but 60+ in 365-day view
- **Solution**: UI needs longer time period to show historical Paid Search data

### 5. Sync Gap Issue ⚠️ DISCOVERED
- **Problem**: Recent orders from Google Sheets (October 2025) not in database
- **Evidence**: Orders 54526, 54524, 54522, etc. from October 2025 missing from DB
- **Impact**: Database only has orders up to April 2025, missing recent Paid Search orders
- **Status**: Needs sync investigation and fresh data pull

## Current Status

### ✅ Completed
- [x] Identified missing channel classification rules
- [x] Applied classification fix (15 rules created)
- [x] Verified attribution data capture (100% coverage)
- [x] Confirmed classification logic works (322 Paid Search orders)
- [x] Identified date filter limitation (55 days too restrictive)
- [x] Discovered sync gap (recent orders missing)

### ⚠️ Pending
- [ ] Investigate WooCommerce sync status
- [ ] Trigger fresh sync for recent orders
- [ ] Verify recent Paid Search orders appear after sync
- [ ] Test UI with longer time periods
- [ ] Compare final counts with Google Sheets

## Technical Details

### Channel Classification Rules Created
```
google/utm → Paid Search
google/cpc → Paid Search  
google/ppc → Paid Search
bing/cpc → Paid Search
google/organic → SEO
(direct)/typein → Direct
chatgpt.com/utm → ChatGpt
trustpilot/utm → Referral
bing.com/referral → Referral
dk.search.yahoo.com/referral → Referral
```

### Database Status
- **Total Orders**: 3,808 (Porsa.dk: 1,029, Dupskoshoppen.dk: 2,779)
- **Attribution Coverage**: 99.9%+ for both stores
- **Paid Search Orders**: 322 total (correctly classified)
- **Recent Orders Gap**: Missing October 2025 orders

### Commands Used
```bash
# Fix classification rules
docker exec vvv-frontpage-backend-1 python3 manage.py update_channel_classifications

# Verify rules
docker exec vvv-frontpage-backend-1 python3 manage.py shell -c "
from woocommerce.models import ChannelClassification
rules = ChannelClassification.objects.filter(is_active=True)
print(f'Total active rules: {rules.count()}')
"

# Check order attribution
docker exec vvv-frontpage-backend-1 python3 manage.py shell -c "
from woocommerce.models import WooCommerceOrder
orders = WooCommerceOrder.objects.filter(client_name='Porsa.dk')
print(f'Orders with attribution: {orders.exclude(attribution_utm_source__isnull=True).count()}')
"
```

## Next Steps

1. **Investigate Sync Status**
   - Check recent sync logs and jobs
   - Identify why recent orders aren't syncing
   - Trigger fresh sync for recent data

2. **Verify Complete Fix**
   - Confirm recent Paid Search orders appear after sync
   - Test UI with various time periods
   - Compare final counts with Google Sheets

3. **UI Improvements**
   - Consider changing default time period from 55 days
   - Add "All Time" option for historical analysis
   - Ensure proper caching of channel data

## Files Created
- `audit_woocommerce_analytics.py` - Comprehensive audit script
- `audit_woocommerce_sql.sql` - SQL queries for direct DB checks
- `AUDIT_WOOCOMMERCE_ANALYTICS.md` - Audit instructions

## Conclusion

The Paid Search undercounting issue was primarily caused by missing channel classification rules. The fix is working correctly for historical data (322 Paid Search orders properly classified), but there's a sync gap preventing recent orders from appearing in the database. Once the sync issue is resolved, the app should show Paid Search counts matching the Google Sheets data.










