# Paid Search Data Validation Checklist

## What to Validate

### Expected Paid Search Orders in Database

**Sept 22-23, 2025 (5 orders):**
- Order 54484: DKK 43.00 (2025-09-23 13:35:23)
- Order 54482: DKK 112.50 (2025-09-22 20:56:27)
- Order 54481: DKK 100.00 (2025-09-22 19:55:09)
- Order 54479: DKK 1,353.00 (2025-09-22 13:27:29)
- Order 54477: DKK 141.00 (2025-09-22 11:20:50)

**Total Revenue:** DKK 1,749.50

### In Your Google Sheets Report

Look for orders with:
- **UTM Source:** `google`
- **Source Type:** `utm`
- **Channel Type:** `Paid Search`

These should match the order IDs above.

## What to Check

1. ✅ Channel classification rules are configured (already done)
2. ⚠️ Missing data: The 5 paid search orders need to be restored to production database
3. ✅ New orders with `google/utm` will be classified correctly
4. ⚠️ Historical orders are missing after database wipe

## Validation Steps

### Step 1: Check Current Database
Run on production server:
```bash
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceOrder, ChannelClassification
print('Total Porsa.dk orders:', WooCommerceOrder.objects.filter(client_name__icontains='porsa').count())
print('Paid Search orders:', WooCommerceOrder.objects.filter(client_name__icontains='porsa', attribution_utm_source='google', attribution_source_type='utm').count())
"
```

### Step 2: Compare with Google Sheets
- Export your Google Sheets report
- Look for orders with UTM Source = `google` and Source Type = `utm`
- Compare order counts and revenue

### Step 3: Verify Channel Performance Report
- Check app at: https://veveve.dk/channel-performance/porsa.dk
- Paid Search should show 5 orders and DKK 1,749.50 revenue (after restoration)

## Issues to Note

1. **Data Gap**: Sept 23 - Oct 27 is missing from database (wipe occurred)
2. **Historical Data**: Only the 5 orders from Sept 22-23 exist in original export
3. **Future Data**: New WooCommerce orders will sync and be classified correctly

## Next Steps

To fully restore:
1. Run the restore command on production (provided in previous messages)
2. Or wait for WooCommerce sync to pull new orders
3. Re-export data from WooCommerce to get complete Sept-Oct dataset

## Notes

- The channel classification rules are working correctly
- The issue is missing data after the database wipe
- Once data is restored, reporting will be accurate












