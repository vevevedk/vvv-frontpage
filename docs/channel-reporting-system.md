# Channel Reporting System

## Overview

The Channel Reporting System is a comprehensive marketing attribution tool that automatically classifies WooCommerce traffic sources into marketing channels and provides detailed performance analytics with period-over-period comparisons.

## Features

### 🎯 **Automatic Channel Classification**
- Automatically categorizes traffic sources based on Source/Medium combinations
- Uses configurable classification rules that can be managed through the admin interface
- Supports all major marketing channels: Direct, SEO, Paid Social, Email, etc.

### 📊 **Performance Analytics**
- **Sessions**: Traffic volume by channel
- **Orders**: Conversion count by channel
- **Order Total**: Revenue by channel
- **CVR**: Conversion Rate (Orders/Sessions)
- **AOV**: Average Order Value (Revenue/Orders)

### 📈 **Period-over-Period Comparisons**
- **Month over Month (MoM)**: Compare current period with previous period
- **Quarter over Quarter (QoQ)**: Compare current quarter with previous quarter
- **Year over Year (YoY)**: Compare current year with previous year
- Percentage changes for all metrics with visual indicators

### 🔍 **Unclassified Data Detection**
- Automatically flags traffic sources that don't match existing classification rules
- Provides examples of unclassified sources for easy review
- Integrated classification manager for adding new rules

## Channel Types

The system supports the following channel types:

| Channel Type | Description | Examples |
|--------------|-------------|----------|
| **Direct** | Direct traffic, bookmarks, typed URLs | `(direct)/typein` |
| **SEO** | Organic search traffic | `google/organic`, `bing.com/referral` |
| **Organic Social** | Social media referrals | `l.instagram.com/referral` |
| **Email** | Email marketing campaigns | `mailpoet/utm`, `Klaviyo/utm` |
| **Paid Social** | Paid social media advertising | `fb/utm`, `ig/utm` |
| **Paid Search** | Paid search advertising | `google/utm` |
| **Referal** | Partner and affiliate traffic | `app.wonnda.com/referral` |
| **ChatGpt** | AI-powered traffic sources | `chatgpt.com/referral`, `chatgpt.com/utm` |
| **Test** | Testing and development traffic | `tagassistant.google.com/referral` |

## API Endpoints

### Frontend (Next.js)
- `GET /api/woocommerce/channels/report` - Channel performance report
- `GET /api/woocommerce/channels/classifications` - List classification rules
- `POST /api/woocommerce/channels/classifications` - Create new rule
- `PUT /api/woocommerce/channels/classifications/[id]` - Update rule
- `DELETE /api/woocommerce/channels/classifications/[id]` - Delete rule

### Backend (Django)
- `GET /api/woocommerce/orders/channels_report/` - Channel report data
- `GET /api/woocommerce/channels/classifications/` - Classification rules CRUD

## Data Structure

### Channel Report Response
```json
{
  "currentPeriod": {
    "dateStart": "2025-06-18",
    "dateEnd": "2025-08-12",
    "offset": 0,
    "lookback": 55,
    "comparison": "MoM",
    "total": {
      "channelType": "Total",
      "sessions": 109,
      "orders": 13,
      "orderTotal": 9620,
      "cvr": 11.9,
      "aov": 740
    },
    "channels": [
      {
        "channelType": "Direct",
        "sessions": 35,
        "orders": 4,
        "orderTotal": 5133,
        "cvr": 11.4,
        "aov": 1283
      }
    ]
  },
  "comparisonPeriod": { /* Similar structure */ },
  "popChange": {
    "total": {
      "sessions": -50.0,
      "orders": -61.8,
      "orderTotal": -70.4,
      "cvr": -23.5,
      "aov": -22.5
    },
    "channels": { /* Channel-level changes */ }
  },
  "unclassifiedData": {
    "count": 3,
    "examples": [
      {
        "source": "newsource.com",
        "medium": "referral",
        "sourceMedium": "newsource.com/referral",
        "sessions": 15
      }
    ]
  }
}
```

## Usage

### 1. Access Channel Report
Navigate to **Reporting & Analytics → WooCommerce → Channels** tab in the dashboard.

### 2. Configure Report Parameters
- **Period**: Select time range (7, 30, 55, 90, 365 days)
- **Comparison**: Choose MoM, QoQ, or YoY comparison
- **Client**: Filter by specific WooCommerce store or view all

### 3. Review Performance
- View overall performance metrics
- Analyze channel-level performance
- Review period-over-period changes
- Identify top-performing channels

### 4. Manage Classifications
- Click "Review & Classify" for unclassified sources
- Use the Classification Manager to add/edit rules
- Ensure all traffic sources are properly categorized

## Classification Rules Management

### Adding New Rules
1. Open the Classification Manager
2. Fill in Source, Medium, Channel, and Channel Type
3. Set active status
4. Save the rule

### Rule Priority
- Rules are processed in order of creation
- First matching rule is applied
- Use specific rules before general ones

### Best Practices
- Use exact source/medium combinations
- Group similar sources under consistent channel types
- Regularly review and update classifications
- Test new rules with sample data

## Database Schema

### ChannelClassification Model
```python
class ChannelClassification(models.Model):
    source = models.CharField(max_length=255)           # Traffic source
    medium = models.CharField(max_length=255)           # Traffic medium
    source_medium = models.CharField(max_length=255)    # Combined source/medium
    channel = models.CharField(max_length=255)          # Channel name
    channel_type = models.CharField(max_length=50)      # Channel category
    is_active = models.BooleanField(default=True)       # Rule status
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## Setup and Installation

### 1. Database Migration
```bash
cd backend
python manage.py makemigrations woocommerce
python manage.py migrate
```

### 2. Populate Default Classifications
```bash
python manage.py populate_channel_classifications
```

### 3. Verify Configuration
- Check Django admin for ChannelClassification entries
- Verify API endpoints are accessible
- Test frontend integration

## Troubleshooting

### Common Issues

#### No Data Available
- Check if WooCommerce orders exist in the database
- Verify classification rules are active
- Check API endpoint connectivity

#### Missing Channel Types
- Ensure classification rules cover all traffic sources
- Check for typos in source/medium combinations
- Verify rules are marked as active

#### API Errors
- Check Django backend is running
- Verify database migrations are applied
- Check authentication and permissions

### Debug Commands
```bash
# Check classification rules
python manage.py shell
from woocommerce.models import ChannelClassification
ChannelClassification.objects.all().count()

# Test API endpoint
curl http://localhost:8001/api/woocommerce/orders/channels_report/?period=30
```

## Future Enhancements

### Planned Features
- **Real-time Analytics**: Live updates during data processing
- **Custom Channel Types**: User-defined channel categories
- **Advanced Filtering**: Date ranges, customer segments, product categories
- **Export Functionality**: CSV/Excel export of reports
- **Alert System**: Notifications for significant performance changes
- **Integration**: Google Analytics, Facebook Ads, Google Ads

### Performance Optimizations
- Database indexing for large datasets
- Caching for frequently accessed reports
- Background processing for complex calculations
- API response compression

## Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review Django and browser console logs
3. Verify database connectivity and permissions
4. Contact the development team with specific error details

---

*This system provides enterprise-level marketing attribution capabilities, helping you understand the true performance of your marketing channels and optimize your marketing spend effectively.*






















