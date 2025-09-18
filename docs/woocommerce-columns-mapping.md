# WooCommerce Columns Mapping

This document maps the WordPress WooCommerce export plugin columns to our database fields, showing exactly what data we're capturing from the WooCommerce API.

## Complete Column Mapping

### **Core Order Information**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `order_id` | `order_id` | WooCommerce order ID | CharField(50) |
| `order_number` | `order_number` | Order number (e.g., #12345) | CharField(50) |
| `order_date` | `order_date` | When the order was created | DateTimeField |
| `paid_date` | `paid_date` | When the order was paid | DateTimeField |
| `status` | `status` | Order status (processing, completed, etc.) | CharField(50) |

### **Financial Information**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `shipping_total` | `shipping_total` | Total shipping cost | DecimalField(10,2) |
| `shipping_tax_total` | `shipping_tax_total` | Tax on shipping | DecimalField(10,2) |
| `fee_total` | `fee_total` | Total fees | DecimalField(10,2) |
| `fee_tax_total` | `fee_tax_total` | Tax on fees | DecimalField(10,2) |
| `tax_total` | `tax_total` | Total tax amount | DecimalField(10,2) |
| `cart_discount` | `cart_discount` | Cart-level discounts | DecimalField(10,2) |
| `order_discount` | `order_discount` | Order-level discounts | DecimalField(10,2) |
| `discount_total` | `discount_total` | Total discounts applied | DecimalField(10,2) |
| `order_total` | `order_total` | Final order total | DecimalField(10,2) |
| `order_subtotal` | `order_subtotal` | Subtotal before taxes/fees | DecimalField(10,2) |
| `order_currency` | `order_currency` | Currency code (USD, EUR, etc.) | CharField(3) |

### **Payment Information**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `payment_method` | `payment_method` | Payment method ID | CharField(100) |
| `payment_method_title` | `payment_method_title` | Human-readable payment method | CharField(100) |
| `transaction_id` | `transaction_id` | Payment processor transaction ID | CharField(100) |
| `order_key` | `order_key` | WooCommerce order key | CharField(100) |

### **Customer Analytics**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `customer_ip_address` | `customer_ip_address` | Customer's IP address | GenericIPAddressField |
| `customer_user_agent` | `customer_user_agent` | Customer's browser/device info | TextField |
| `customer_id` | `customer_id` | WooCommerce customer ID | CharField(50) |
| `customer_user` | `customer_user` | Customer username | CharField(100) |
| `customer_email` | `customer_email` | Customer email address | EmailField |
| `customer_note` | `customer_note` | Notes from customer | TextField |

### **Billing Address (Detailed)**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `billing_first_name` | `billing_first_name` | Billing first name | CharField(100) |
| `billing_last_name` | `billing_last_name` | Billing last name | CharField(100) |
| `billing_company` | `billing_company` | Billing company name | CharField(100) |
| `billing_email` | `billing_email` | Billing email address | EmailField |
| `billing_phone` | `billing_phone` | Billing phone number | CharField(20) |
| `billing_address_1` | `billing_address_1` | Billing address line 1 | CharField(255) |
| `billing_address_2` | `billing_address_2` | Billing address line 2 | CharField(255) |
| `billing_postcode` | `billing_postcode` | Billing postal code | CharField(20) |
| `billing_city` | `billing_city` | Billing city | CharField(100) |
| `billing_state` | `billing_state` | Billing state/province | CharField(100) |
| `billing_country` | `billing_country` | Billing country | CharField(100) |

### **Shipping Address (Detailed)**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `shipping_first_name` | `shipping_first_name` | Shipping first name | CharField(100) |
| `shipping_last_name` | `shipping_last_name` | Shipping last name | CharField(100) |
| `shipping_company` | `shipping_company` | Shipping company name | CharField(100) |
| `shipping_phone` | `shipping_phone` | Shipping phone number | CharField(20) |
| `shipping_address_1` | `shipping_address_1` | Shipping address line 1 | CharField(255) |
| `shipping_address_2` | `shipping_address_2` | Shipping address line 2 | CharField(255) |
| `shipping_postcode` | `shipping_postcode` | Shipping postal code | CharField(20) |
| `shipping_city` | `shipping_city` | Shipping city | CharField(100) |
| `shipping_state` | `shipping_state` | Shipping state/province | CharField(100) |
| `shipping_country` | `shipping_country` | Shipping country | CharField(100) |
| `shipping_method` | `shipping_method` | Shipping method used | CharField(100) |

### **Order Attribution (Marketing Analytics)**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `meta:_wc_order_attribution_device_type` | `attribution_device_type` | Device type (mobile, desktop, tablet) | CharField(50) |
| `meta:_wc_order_attribution_referrer` | `attribution_referrer` | Referrer URL | URLField |
| `meta:_wc_order_attribution_session_count` | `attribution_session_count` | Number of sessions | IntegerField |
| `meta:_wc_order_attribution_session_entry` | `attribution_session_entry` | Session entry point | CharField(255) |
| `meta:_wc_order_attribution_session_pages` | `attribution_session_pages` | Pages viewed in session | IntegerField |
| `meta:_wc_order_attribution_session_start_time` | `attribution_session_start_time` | When session started | DateTimeField |
| `meta:_wc_order_attribution_source_type` | `attribution_source_type` | Source type (organic, paid, etc.) | CharField(50) |
| `meta:_wc_order_attribution_user_agent` | `attribution_user_agent` | User agent string | TextField |
| `meta:_wc_order_attribution_utm_source` | `attribution_utm_source` | UTM source parameter | CharField(255) |

### **Line Items (Products)**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `Product Item X Name` | `product_name` | Product name | CharField(255) |
| `Product Item X id` | `product_id` | Product ID | CharField(50) |
| `Product Item X SKU` | `product_sku` | Product SKU | CharField(100) |
| `Product Item X Quantity` | `quantity` | Quantity ordered | IntegerField |
| `Product Item X Total` | `total_price` | Total price for this item | DecimalField(10,2) |
| `Product Item X Subtotal` | `subtotal` | Subtotal for this item | DecimalField(10,2) |

### **Additional Fields**
| WordPress Export Column | Database Field | Description | Data Type |
|------------------------|----------------|-------------|-----------|
| `wt_import_key` | `wt_import_key` | Import key for data processing | CharField(100) |
| `client_name` | `client_name` | Account/client name | CharField(255) |
| `raw_data` | `raw_data` | Complete WooCommerce API response | JSONField |
| `created_at` | `created_at` | When record was created in our system | DateTimeField |
| `updated_at` | `updated_at` | When record was last updated | DateTimeField |

## Data Sources

### **Primary Source: WooCommerce REST API**
Most fields are fetched directly from the WooCommerce REST API endpoint: `/wp-json/wc/v3/orders`

### **Secondary Source: Meta Data**
Attribution fields are extracted from the `meta_data` array in the WooCommerce API response, specifically looking for keys starting with `_wc_order_attribution_`

### **Legacy Compatibility**
We maintain backward compatibility by keeping the original field names alongside the new detailed fields.

## Benefits of This Structure

1. **Complete Data Capture**: We now capture all fields available in the WordPress export
2. **Marketing Attribution**: Full visibility into traffic sources and customer journey
3. **Financial Analytics**: Detailed breakdown of costs, taxes, and discounts
4. **Customer Insights**: IP addresses, user agents, and detailed contact information
5. **Address Analysis**: Structured address fields for geolocation and analytics
6. **Performance**: Indexed fields for fast queries on key data points

## Usage Examples

### **Marketing Attribution Query**
```sql
SELECT attribution_utm_source, COUNT(*) as orders, SUM(order_total) as revenue
FROM woocommerce_orders 
WHERE attribution_utm_source IS NOT NULL
GROUP BY attribution_utm_source;
```

### **Geographic Analysis**
```sql
SELECT billing_country, billing_state, COUNT(*) as orders
FROM woocommerce_orders 
GROUP BY billing_country, billing_state;
```

### **Device Performance**
```sql
SELECT attribution_device_type, 
       COUNT(*) as orders, 
       AVG(order_total) as avg_order_value
FROM woocommerce_orders 
WHERE attribution_device_type IS NOT NULL
GROUP BY attribution_device_type;
```

This comprehensive mapping ensures we capture the full value of WooCommerce data for advanced analytics and reporting.


















